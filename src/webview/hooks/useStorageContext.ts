import { useEffect, useMemo, useState } from "react"

import { EVENT_NAME } from "../../common/constants"
import { ServerMessage } from "../../common/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = globalThis as any

export enum StorageType {
  Global = "global",
  Session = "session",
  Workspace = "workspace"
}

interface StorageEventNames {
  listen: string
  fetch: string
  store: string
}

export const useStorageContext = <T>(storageType: StorageType, key: string) => {
  const [context, setContextState] = useState<T | undefined>()

  const eventNames = useMemo((): StorageEventNames => {
    const eventMap = {
      [StorageType.Global]: {
        listen: `${EVENT_NAME.voidGlobalContext}-${key}`,
        fetch: EVENT_NAME.voidGlobalContext,
        store: EVENT_NAME.voidSetGlobalContext
      },
      [StorageType.Session]: {
        listen: `${EVENT_NAME.voidSessionContext}-${key}`,
        fetch: EVENT_NAME.voidSessionContext,
        store: EVENT_NAME.voidSetSessionContext
      },
      [StorageType.Workspace]: {
        listen: `${EVENT_NAME.voidGetWorkspaceContext}-${key}`,
        fetch: EVENT_NAME.voidGetWorkspaceContext,
        store: EVENT_NAME.voidSetWorkspaceContext
      }
    }
    return eventMap[storageType]
  }, [storageType, key])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message: ServerMessage = event.data
      if (message?.type === eventNames.listen) {
        setContextState(event.data.data)
      }
    }

    window.addEventListener("message", handler)
    global.vscode.postMessage({
      type: eventNames.fetch,
      key
    })

    return () => window.removeEventListener("message", handler)
  }, [eventNames.listen, eventNames.fetch, key])

  const setContext = (value: T) => {
    setContextState(value)
    global.vscode.postMessage({
      type: eventNames.store,
      key,
      data: value
    })
  }

  return { context, setContext }
}
