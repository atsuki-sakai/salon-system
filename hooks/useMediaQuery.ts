'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)
      
      // 初期値を設定
      setMatches(media.matches)
      
      // リスナーを設定して変更を検知
      const listener = () => {
        setMatches(media.matches)
      }
      
      // メディアクエリの変更を監視
      if (media.addEventListener) {
        media.addEventListener('change', listener)
        return () => media.removeEventListener('change', listener)
      } else {
        // Safari用後方互換性
        media.addListener(listener)
        return () => media.removeListener(listener)
      }
    }
    
    // SSRの場合はデフォルト値を返す
    return undefined
  }, [query])
  
  return matches
}