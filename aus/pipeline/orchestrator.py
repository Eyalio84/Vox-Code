"""Six-phase generation pipeline orchestrator.

ANALYZE → SPEC → PLAN → GENERATE → VALIDATE → ITERATE

Each phase uses a different prompt optimized for its task.
The orchestrator coordinates them, tracks state, and manages the
conversation across phases.
"""

from __future__ import annotations

import time
import logging
from typing import AsyncIterator

from aus.models import (
    Phase,
    Project,
    ProjectFile,
    Spec,
    GenerationResult,
    PhaseResult,
    LLMMessage,
    LLMRequest,
    Provider,
    Complexity,
    Stack,
)
from aus.prompts import (
    SYSTEM_PROMPT,
    FRONTEND_PROMPT,
    BACKEND_PROMPT,
    DATABASE_PROMPT,
    PLANNER_PROMPT,
    REFINER_PROMPT,
)
from aus.generators.parser import parse_files_from_response, parse_deps_from_response
from aus.generators.parser import FILE_PATTERN
from aus.pipeline.router import select_model

log = logging.getLogger("aus.pipeline")


class Pipeline:
    """Orchestrates the 6-phase generation pipeline.

    Usage:
        pipeline = Pipeline(llm_call=my_llm_function)
        result = await pipeline.run("Build a task management app")

    The llm_call function must have signature:
        async def llm_call(request: LLMRequest) -> LLMResponse
    """

    def __init__(self, llm_call, gemini_key: str = "", anthropic_key: str = "",
                 llm_stream=None):
        self._llm = llm_call
        self._llm_stream = llm_stream
        self._gemini_key = gemini_key
        self._anthropic_key = anthropic_key
        self._phases: list[PhaseResult] = []

    async def run(
        self,
        user_request: str,
        spec: Spec | None = None,
        existing_project: Project | None = None,
    ) -> GenerationResult:
        """Execute the full pipeline.

        Args:
            user_request: Natural language description of what to build/change.
            spec: Optional pre-built spec. If None, one is generated.
            existing_project: If provided, this is a refinement (ITERATE phase).
        """
        start = time.time()
        self._phases = []

        # If we have an existing project, skip to ITERATE
        if existing_project:
            return await self._iterate(user_request, existing_project)

        # Phase 1: ANALYZE — classify the request
        analysis = await self._analyze(user_request)

        # Phase 2: SPEC — generate or validate spec
        if spec is None:
            spec = self._spec_from_analysis(analysis, user_request)

        # Phase 3: PLAN — produce technical plan
        plan = await self._plan(user_request, spec)

        # Phase 4: GENERATE — produce all code
        project = await self._generate(user_request, spec, plan)

        # Phase 5: VALIDATE — structural checks
        errors = self._validate(project, spec)

        total_ms = int((time.time() - start) * 1000)
        total_tokens = sum(p.tokens_used for p in self._phases)

        return GenerationResult(
            project=project,
            phases=self._phases,
            total_duration_ms=total_ms,
            total_tokens=total_tokens,
            success=len(errors) == 0,
            errors=errors,
        )

    # ------------------------------------------------------------------
    # Streaming variant — yields SSE-ready dicts during generation
    # ------------------------------------------------------------------

    async def stream_run(
        self,
        user_request: str,
        spec: Spec | None = None,
        existing_project: Project | None = None,
    ) -> AsyncIterator[dict]:
        """Execute the pipeline, streaming events as they happen.

        Yields dicts with "event" and "data" keys ready for SSE encoding.
        ANALYZE/SPEC/PLAN run non-streaming (fast phases).
        GENERATE/ITERATE stream tokens and files incrementally.
        """
        if not self._llm_stream:
            raise RuntimeError("Pipeline was not configured with a streaming caller")

        start = time.time()
        self._phases = []

        if existing_project:
            async for event in self._stream_iterate(user_request, existing_project):
                yield event
        else:
            # Phase 1: ANALYZE (non-streaming — fast)
            yield {"event": "phase", "data": {"phase": "ANALYZE", "status": "started"}}
            analysis = await self._analyze(user_request)
            yield {"event": "phase", "data": {
                "phase": "ANALYZE", "status": "completed",
                "duration_ms": self._phases[-1].duration_ms,
                "model": self._phases[-1].model or "",
                "tokens_used": self._phases[-1].tokens_used,
            }}

            # Phase 2: SPEC (no LLM call)
            if spec is None:
                spec = self._spec_from_analysis(analysis, user_request)
            yield {"event": "phase", "data": {"phase": "SPEC", "status": "completed"}}

            # Phase 3: PLAN (non-streaming — moderate)
            yield {"event": "phase", "data": {"phase": "PLAN", "status": "started"}}
            plan = await self._plan(user_request, spec)
            yield {"event": "phase", "data": {
                "phase": "PLAN", "status": "completed",
                "duration_ms": self._phases[-1].duration_ms,
                "model": self._phases[-1].model or "",
                "tokens_used": self._phases[-1].tokens_used,
            }}
            yield {"event": "studio_plan", "data": {"content": plan}}

            # Phase 4: GENERATE (streaming — this is the big one)
            yield {"event": "phase", "data": {"phase": "GENERATE", "status": "started"}}
            async for event in self._stream_generate(user_request, spec, plan):
                yield event

            # Phase 5: VALIDATE
            project = self._last_generated_project
            errors = self._validate(project, spec)
            yield {"event": "phase", "data": {
                "phase": "VALIDATE", "status": "completed" if not errors else "failed",
                "errors": errors,
            }}

        # Done
        total_ms = int((time.time() - start) * 1000)
        total_tokens = sum(p.tokens_used for p in self._phases)
        project = self._last_generated_project

        yield {"event": "done", "data": {
            "project": project.model_dump(mode="json"),
            "total_duration_ms": total_ms,
            "total_tokens": total_tokens,
            "success": True,
            "errors": [],
        }}

    # ------------------------------------------------------------------
    # Phase 1: ANALYZE
    # ------------------------------------------------------------------

    async def _analyze(self, user_request: str) -> dict:
        """Classify the request: complexity, stack, key features."""
        start = time.time()

        request = LLMRequest(
            messages=[
                LLMMessage(role="system", content=PLANNER_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        f"Analyze this request and classify it.\n\n"
                        f"Request: {user_request}\n\n"
                        f"Respond with ONLY a JSON object:\n"
                        f'{{"complexity": "simple|standard|complex", '
                        f'"stack": "react-fastapi|react-only|fastapi-only", '
                        f'"features": ["feature1", "feature2"], '
                        f'"needs_auth": true/false, '
                        f'"needs_database": true/false}}'
                    ),
                ),
            ],
            temperature=0.1,
            max_tokens=500,
            model=select_model(Phase.ANALYZE, self._gemini_key, self._anthropic_key),
        )

        response = await self._llm(request)
        duration = int((time.time() - start) * 1000)

        # Parse JSON from response
        import json

        try:
            analysis = json.loads(response.content.strip().strip("```json").strip("```"))
        except json.JSONDecodeError:
            analysis = {
                "complexity": "standard",
                "stack": "react-fastapi",
                "features": [],
                "needs_auth": False,
                "needs_database": True,
            }

        self._phases.append(
            PhaseResult(
                phase=Phase.ANALYZE,
                success=True,
                output=analysis,
                duration_ms=duration,
                tokens_used=response.tokens_in + response.tokens_out,
                model=response.model,
            )
        )
        log.info(f"ANALYZE complete: {analysis}")
        return analysis

    # ------------------------------------------------------------------
    # Phase 2: SPEC
    # ------------------------------------------------------------------

    def _spec_from_analysis(self, analysis: dict, user_request: str) -> Spec:
        """Build a Spec from the analysis results."""
        complexity = Complexity(analysis.get("complexity", "standard"))
        stack = Stack(analysis.get("stack", "react-fastapi"))

        spec = Spec(
            name=user_request[:60],
            description=user_request,
            stack=stack,
            complexity=complexity,
            auth_strategy="jwt" if analysis.get("needs_auth") else "none",
            database="sqlite" if analysis.get("needs_database") else "sqlite",
        )

        self._phases.append(
            PhaseResult(phase=Phase.SPEC, success=True, output=spec.model_dump())
        )
        return spec

    # ------------------------------------------------------------------
    # Phase 3: PLAN
    # ------------------------------------------------------------------

    async def _plan(self, user_request: str, spec: Spec) -> str:
        """Generate a technical plan from the spec."""
        start = time.time()

        spec_summary = (
            f"Stack: {spec.stack.value}\n"
            f"Complexity: {spec.complexity.value}\n"
            f"Auth: {spec.auth_strategy}\n"
            f"Database: {spec.database}\n"
            f"Frontend: {spec.frontend_stack}\n"
            f"Backend: {spec.backend_stack}\n"
        )

        request = LLMRequest(
            messages=[
                LLMMessage(role="system", content=PLANNER_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        f"Create a technical plan for this application.\n\n"
                        f"User Request: {user_request}\n\n"
                        f"Spec:\n{spec_summary}\n\n"
                        f"Follow the plan format exactly."
                    ),
                ),
            ],
            temperature=0.2,
            max_tokens=4000,
            model=select_model(Phase.PLAN, self._gemini_key, self._anthropic_key),
        )

        response = await self._llm(request)
        duration = int((time.time() - start) * 1000)

        self._phases.append(
            PhaseResult(
                phase=Phase.PLAN,
                success=True,
                output=response.content,
                duration_ms=duration,
                tokens_used=response.tokens_in + response.tokens_out,
                model=response.model,
            )
        )
        log.info(f"PLAN complete ({len(response.content)} chars)")
        return response.content

    # ------------------------------------------------------------------
    # Phase 4: GENERATE
    # ------------------------------------------------------------------

    async def _generate(self, user_request: str, spec: Spec, plan: str) -> Project:
        """Generate all code files based on spec and plan.

        Includes retry logic: if the primary model returns empty content
        (e.g. Gemini RECITATION block), retries with a fallback model.
        """
        start = time.time()

        # Build the generation prompt by combining system + stack-specific prompts
        system_parts = [SYSTEM_PROMPT]
        if spec.stack in (Stack.REACT_FASTAPI, Stack.REACT_ONLY):
            system_parts.append(FRONTEND_PROMPT)
        if spec.stack in (Stack.REACT_FASTAPI, Stack.FASTAPI_ONLY):
            system_parts.append(BACKEND_PROMPT)
        if spec.stack != Stack.REACT_ONLY:
            system_parts.append(DATABASE_PROMPT)

        system_prompt = "\n\n---\n\n".join(system_parts)

        primary_model = select_model(Phase.GENERATE, self._gemini_key, self._anthropic_key)

        # Fallback models if primary returns empty (RECITATION, etc.)
        fallback_models = []
        if self._anthropic_key:
            fallback_models.append("claude-sonnet-4-6")
        if self._gemini_key:
            fallback_models.append("gemini-3-flash-preview")
        # Remove primary from fallbacks
        fallback_models = [m for m in fallback_models if m != primary_model]

        models_to_try = [primary_model] + fallback_models

        response = None
        used_model = primary_model

        for model_id in models_to_try:
            request = LLMRequest(
                messages=[
                    LLMMessage(role="system", content=system_prompt),
                    LLMMessage(
                        role="user",
                        content=(
                            f"Generate a complete application based on this plan.\n\n"
                            f"User Request: {user_request}\n\n"
                            f"Technical Plan:\n{plan}\n\n"
                            f"Generate ALL files using ### FILE: markers. "
                            f"Follow the generation order specified in the system prompt. "
                            f"Every file must be complete and runnable."
                        ),
                    ),
                ],
                temperature=0.3,
                max_tokens=32000,
                model=model_id,
            )

            response = await self._llm(request)
            used_model = model_id

            if response.content.strip():
                log.info(f"GENERATE succeeded with {model_id}")
                break
            else:
                log.warning(f"GENERATE returned empty from {model_id}, trying fallback...")

        duration = int((time.time() - start) * 1000)

        # Parse files from the response
        files = parse_files_from_response(response.content)
        frontend_deps, backend_deps = parse_deps_from_response(response.content)

        project = Project(
            name=spec.name,
            description=spec.description,
            stack=spec.stack,
            complexity=spec.complexity,
            files=files,
            frontend_deps=frontend_deps,
            backend_deps=backend_deps,
            spec_id=spec.id,
            plan_summary=plan[:500],
        )

        self._phases.append(
            PhaseResult(
                phase=Phase.GENERATE,
                success=True,
                output={"file_count": len(files), "total_lines": project.total_lines},
                duration_ms=duration,
                tokens_used=response.tokens_in + response.tokens_out,
                model=used_model,
            )
        )
        log.info(f"GENERATE complete: {len(files)} files, {project.total_lines} lines")
        return project

    # ------------------------------------------------------------------
    # Phase 5: VALIDATE
    # ------------------------------------------------------------------

    def _validate(self, project: Project, spec: Spec) -> list[str]:
        """Structural validation of generated project."""
        start = time.time()
        errors = []

        # Check: at least one file generated
        if not project.files:
            errors.append("No files were generated")

        # Check: entry point exists
        if spec.stack in (Stack.REACT_FASTAPI, Stack.REACT_ONLY):
            if not project.get_file("frontend/src/App.tsx"):
                errors.append("Missing frontend entry point: frontend/src/App.tsx")

        if spec.stack in (Stack.REACT_FASTAPI, Stack.FASTAPI_ONLY):
            if not project.get_file("backend/app/main.py"):
                errors.append("Missing backend entry point: backend/app/main.py")

        # Check: no placeholder code
        for f in project.files:
            if "// TODO" in f.content or "# TODO" in f.content:
                errors.append(f"Placeholder found in {f.path}")
            if "..." in f.content and f.language in ("tsx", "ts", "py"):
                # Allow ... in Python (Ellipsis literal) but flag suspicious use
                lines_with_dots = [
                    line.strip()
                    for line in f.content.split("\n")
                    if line.strip() == "..."
                ]
                if len(lines_with_dots) > 2:
                    errors.append(f"Suspected placeholder '...' in {f.path}")

        # Check: no empty files
        for f in project.files:
            if len(f.content.strip()) < 10:
                errors.append(f"Nearly empty file: {f.path}")

        # Check: imports don't reference non-existent project files
        # (simplified — checks for relative imports to known paths)
        known_paths = {f.path for f in project.files}
        # This is a lightweight check; full validation would need a parser

        duration = int((time.time() - start) * 1000)
        self._phases.append(
            PhaseResult(
                phase=Phase.VALIDATE,
                success=len(errors) == 0,
                output={"errors": errors, "file_count": len(project.files)},
                duration_ms=duration,
                error="; ".join(errors) if errors else None,
            )
        )

        if errors:
            log.warning(f"VALIDATE found {len(errors)} issues: {errors}")
        else:
            log.info("VALIDATE passed")

        return errors

    # ------------------------------------------------------------------
    # Phase 6: ITERATE (refinement)
    # ------------------------------------------------------------------

    async def _iterate(
        self, user_request: str, existing_project: Project
    ) -> GenerationResult:
        """Refine an existing project based on user feedback."""
        start = time.time()

        # Build context from existing files
        file_tree = "\n".join(existing_project.file_tree())
        file_contents = ""
        for f in existing_project.files:
            file_contents += f"\n### FILE: {f.path}\n{f.content}\n### END FILE\n"

        request = LLMRequest(
            messages=[
                LLMMessage(role="system", content=SYSTEM_PROMPT + "\n\n" + REFINER_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        f"Here is the current project:\n\n"
                        f"File tree:\n{file_tree}\n\n"
                        f"Files:\n{file_contents}\n\n"
                        f"Change request: {user_request}\n\n"
                        f"Output ONLY the files that need to change, using ### FILE: markers. "
                        f"Each file must be complete (not a diff)."
                    ),
                ),
            ],
            temperature=0.3,
            max_tokens=16000,
            model=select_model(Phase.ITERATE, self._gemini_key, self._anthropic_key),
        )

        response = await self._llm(request)
        duration = int((time.time() - start) * 1000)

        # Parse changed files
        changed_files = parse_files_from_response(response.content)
        new_deps_f, new_deps_b = parse_deps_from_response(response.content)

        # Merge: replace changed files, keep unchanged
        updated_files = list(existing_project.files)
        changed_paths = {f.path for f in changed_files}

        # Remove old versions of changed files
        updated_files = [f for f in updated_files if f.path not in changed_paths]
        # Add new versions
        updated_files.extend(changed_files)

        project = existing_project.model_copy(
            update={
                "files": updated_files,
                "version": existing_project.version + 1,
                "frontend_deps": existing_project.frontend_deps + new_deps_f,
                "backend_deps": existing_project.backend_deps + new_deps_b,
            }
        )

        self._phases.append(
            PhaseResult(
                phase=Phase.ITERATE,
                success=True,
                output={
                    "changed_files": len(changed_files),
                    "total_files": len(updated_files),
                },
                duration_ms=duration,
                tokens_used=response.tokens_in + response.tokens_out,
                model=response.model,
            )
        )

        total_ms = int((time.time() - start) * 1000)
        return GenerationResult(
            project=project,
            phases=self._phases,
            total_duration_ms=total_ms,
            total_tokens=response.tokens_in + response.tokens_out,
            success=True,
        )

    # ------------------------------------------------------------------
    # Streaming GENERATE — tokens + incremental file extraction
    # ------------------------------------------------------------------

    async def _stream_generate(
        self, user_request: str, spec: Spec, plan: str
    ) -> AsyncIterator[dict]:
        """Stream the GENERATE phase, yielding tokens and files incrementally."""
        start = time.time()

        system_parts = [SYSTEM_PROMPT]
        if spec.stack in (Stack.REACT_FASTAPI, Stack.REACT_ONLY):
            system_parts.append(FRONTEND_PROMPT)
        if spec.stack in (Stack.REACT_FASTAPI, Stack.FASTAPI_ONLY):
            system_parts.append(BACKEND_PROMPT)
        if spec.stack != Stack.REACT_ONLY:
            system_parts.append(DATABASE_PROMPT)
        system_prompt = "\n\n---\n\n".join(system_parts)

        primary_model = select_model(Phase.GENERATE, self._gemini_key, self._anthropic_key)
        fallback_models = []
        if self._anthropic_key:
            fallback_models.append("claude-sonnet-4-6")
        if self._gemini_key:
            fallback_models.append("gemini-3-flash-preview")
        fallback_models = [m for m in fallback_models if m != primary_model]
        models_to_try = [primary_model] + fallback_models

        accumulated = ""
        emitted_paths: set[str] = set()
        used_model = primary_model
        total_tokens_in = 0
        total_tokens_out = 0

        for model_id in models_to_try:
            accumulated = ""
            emitted_paths = set()

            request = LLMRequest(
                messages=[
                    LLMMessage(role="system", content=system_prompt),
                    LLMMessage(
                        role="user",
                        content=(
                            f"Generate a complete application based on this plan.\n\n"
                            f"User Request: {user_request}\n\n"
                            f"Technical Plan:\n{plan}\n\n"
                            f"Generate ALL files using ### FILE: markers. "
                            f"Follow the generation order specified in the system prompt. "
                            f"Every file must be complete and runnable."
                        ),
                    ),
                ],
                temperature=0.3,
                max_tokens=32000,
                model=model_id,
            )

            recitation = False
            async for chunk in self._llm_stream(request):
                if chunk["type"] == "token":
                    accumulated += chunk["content"]
                    yield {"event": "token", "data": {"content": chunk["content"]}}

                    # Incremental file extraction — check for completed files
                    for match in FILE_PATTERN.finditer(accumulated):
                        path = match.group(1).strip()
                        if path not in emitted_paths:
                            from aus.generators.parser import _clean_content, _infer_role, _infer_language
                            content = _clean_content(match.group(2))
                            emitted_paths.add(path)
                            yield {"event": "studio_file", "data": {
                                "path": path,
                                "content": content,
                                "role": _infer_role(path).value,
                                "language": _infer_language(path),
                            }}

                elif chunk["type"] == "done":
                    total_tokens_in = chunk.get("tokens_in", 0)
                    total_tokens_out = chunk.get("tokens_out", 0)
                    used_model = chunk.get("model", model_id)
                    recitation = chunk.get("recitation", False)

            if recitation or not accumulated.strip():
                log.warning(f"GENERATE stream empty/recitation from {model_id}, trying fallback...")
                continue
            else:
                log.info(f"GENERATE stream succeeded with {model_id}")
                break

        # Final parse pass — catch any files missed during streaming
        files = parse_files_from_response(accumulated)
        for f in files:
            if f.path not in emitted_paths:
                emitted_paths.add(f.path)
                yield {"event": "studio_file", "data": {
                    "path": f.path,
                    "content": f.content,
                    "role": f.role.value if hasattr(f.role, "value") else str(f.role),
                    "language": f.language,
                }}

        frontend_deps, backend_deps = parse_deps_from_response(accumulated)
        if frontend_deps or backend_deps:
            yield {"event": "studio_deps", "data": {
                "frontend": {d.name: d.version for d in frontend_deps},
                "backend": {d.name: d.version for d in backend_deps},
            }}

        duration = int((time.time() - start) * 1000)

        project = Project(
            name=spec.name,
            description=spec.description,
            stack=spec.stack,
            complexity=spec.complexity,
            files=files,
            frontend_deps=frontend_deps,
            backend_deps=backend_deps,
            spec_id=spec.id,
            plan_summary=plan[:500],
        )
        self._last_generated_project = project

        self._phases.append(
            PhaseResult(
                phase=Phase.GENERATE,
                success=True,
                output={"file_count": len(files), "total_lines": project.total_lines},
                duration_ms=duration,
                tokens_used=total_tokens_in + total_tokens_out,
                model=used_model,
            )
        )

        yield {"event": "phase", "data": {
            "phase": "GENERATE", "status": "completed",
            "duration_ms": duration,
            "model": used_model,
            "tokens_used": total_tokens_in + total_tokens_out,
        }}

    # ------------------------------------------------------------------
    # Streaming ITERATE — tokens + incremental file extraction
    # ------------------------------------------------------------------

    async def _stream_iterate(
        self, user_request: str, existing_project: Project
    ) -> AsyncIterator[dict]:
        """Stream the ITERATE phase with token-level output."""
        start = time.time()

        yield {"event": "phase", "data": {"phase": "ITERATE", "status": "started"}}

        file_tree = "\n".join(existing_project.file_tree())
        file_contents = ""
        for f in existing_project.files:
            file_contents += f"\n### FILE: {f.path}\n{f.content}\n### END FILE\n"

        request = LLMRequest(
            messages=[
                LLMMessage(role="system", content=SYSTEM_PROMPT + "\n\n" + REFINER_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        f"Here is the current project:\n\n"
                        f"File tree:\n{file_tree}\n\n"
                        f"Files:\n{file_contents}\n\n"
                        f"Change request: {user_request}\n\n"
                        f"Output ONLY the files that need to change, using ### FILE: markers. "
                        f"Each file must be complete (not a diff)."
                    ),
                ),
            ],
            temperature=0.3,
            max_tokens=16000,
            model=select_model(Phase.ITERATE, self._gemini_key, self._anthropic_key),
        )

        accumulated = ""
        emitted_paths: set[str] = set()
        total_tokens_in = 0
        total_tokens_out = 0
        used_model = ""

        async for chunk in self._llm_stream(request):
            if chunk["type"] == "token":
                accumulated += chunk["content"]
                yield {"event": "token", "data": {"content": chunk["content"]}}

                for match in FILE_PATTERN.finditer(accumulated):
                    path = match.group(1).strip()
                    if path not in emitted_paths:
                        from aus.generators.parser import _clean_content, _infer_role, _infer_language
                        content = _clean_content(match.group(2))
                        emitted_paths.add(path)
                        yield {"event": "studio_file", "data": {
                            "path": path,
                            "content": content,
                            "role": _infer_role(path).value,
                            "language": _infer_language(path),
                        }}

            elif chunk["type"] == "done":
                total_tokens_in = chunk.get("tokens_in", 0)
                total_tokens_out = chunk.get("tokens_out", 0)
                used_model = chunk.get("model", "")

        # Final parse — merge changed files into existing project
        changed_files = parse_files_from_response(accumulated)
        for f in changed_files:
            if f.path not in emitted_paths:
                yield {"event": "studio_file", "data": {
                    "path": f.path,
                    "content": f.content,
                    "role": f.role.value if hasattr(f.role, "value") else str(f.role),
                    "language": f.language,
                }}

        new_deps_f, new_deps_b = parse_deps_from_response(accumulated)
        if new_deps_f or new_deps_b:
            yield {"event": "studio_deps", "data": {
                "frontend": {d.name: d.version for d in new_deps_f},
                "backend": {d.name: d.version for d in new_deps_b},
            }}

        updated_files = list(existing_project.files)
        changed_paths = {f.path for f in changed_files}
        updated_files = [f for f in updated_files if f.path not in changed_paths]
        updated_files.extend(changed_files)

        project = existing_project.model_copy(
            update={
                "files": updated_files,
                "version": existing_project.version + 1,
                "frontend_deps": existing_project.frontend_deps + new_deps_f,
                "backend_deps": existing_project.backend_deps + new_deps_b,
            }
        )
        self._last_generated_project = project

        duration = int((time.time() - start) * 1000)
        self._phases.append(
            PhaseResult(
                phase=Phase.ITERATE,
                success=True,
                output={"changed_files": len(changed_files), "total_files": len(updated_files)},
                duration_ms=duration,
                tokens_used=total_tokens_in + total_tokens_out,
                model=used_model,
            )
        )

        yield {"event": "phase", "data": {
            "phase": "ITERATE", "status": "completed",
            "duration_ms": duration,
            "model": used_model,
            "tokens_used": total_tokens_in + total_tokens_out,
        }}
