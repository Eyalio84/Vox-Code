import React, { createContext, useContext, useState, useCallback } from 'react'

export type VoxModel = 'gemini' | 'claude'

interface VoxModelContextType {
  activeModel: VoxModel
  setActiveModel: (model: VoxModel) => void
}

const STORAGE_KEY = 'vox-active-model'

function loadModel(): VoxModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'gemini' || saved === 'claude') return saved
  } catch { /* SSR or private browsing */ }
  return 'gemini'
}

const VoxModelContext = createContext<VoxModelContextType | null>(null)

export function useVoxModel(): VoxModelContextType {
  const ctx = useContext(VoxModelContext)
  if (!ctx) throw new Error('useVoxModel must be used within VoxModelProvider')
  return ctx
}

export const VoxModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModel, setActiveModelState] = useState<VoxModel>(loadModel)

  const setActiveModel = useCallback((model: VoxModel) => {
    setActiveModelState(model)
    try { localStorage.setItem(STORAGE_KEY, model) } catch { /* ignore */ }
  }, [])

  return (
    <VoxModelContext.Provider value={{ activeModel, setActiveModel }}>
      {children}
    </VoxModelContext.Provider>
  )
}
