export const EVENT_NAME = {
  voidGetLocale: "void-get-locale",
  voidAcceptSolution: "void-accept-solution",
  voidAddMessage: "void-add-message",
  voidChat: "void-chat",
  voidChatMessage: "void-chat-message",
  voidClickSuggestion: "void-click-suggestion",
  voidConnectedToSymmetry: "void-connected-to-symmetry",
  voidConnectSymmetry: "void-connect-symmetry",
  voidDisconnectedFromSymmetry: "void-disconnected-from-symmetry",
  voidDisconnectSymmetry: "void-disconnect-symmetry",
  voidEditDefaultTemplates: "void-edit-default-templates",
  voidEmbedDocuments: "void-embed-documents",
  voidEnableModelDownload: "void-enable-model-download",
  voidFetchOllamaModels: "void-fetch-ollama-models",
  voidFileListRequest: "void-file-list-request",
  voidFileListResponse: "void-file-list-response",
  voidGetConfigValue: "void-get-config-value",
  voidGetGitChanges: "void-get-git-changes",
  voidGetWorkspaceContext: "void-workspace-context",
  voidGithhubReview: "void-githhub-review",
  voidGlobalContext: "void-global-context",
  voidHideBackButton: "void-hide-back-button",
  voidListTemplates: "void-list-templates",
  voidManageTemplates: "void-manage-templates",
  voidNewConversation: "void-new-conversation",
  voidNewDocument: "void-new-document",
  voidNotification: "void-notification",
  voidOnCompletion: "void-on-completion",
  voidOnLoading: "void-on-loading",
  voidOpenDiff: "void-open-diff",
  voidOpenFile: "void-open-file",
  voidRerankThresholdChanged: "void-rerank-threshold-changed",
  voidSendLanguage: "void-send-language",
  voidSendLoader: "void-send-loader",
  voidSendRequestBody: "void-send-request-body",
  voidSendSymmetryMessage: "void-send-symmetry-message",
  voidSendSystemMessage: "void-send-system-message",
  voidSendTheme: "void-send-theme",
  voidSessionContext: "void-session-context",
  voidSetConfigValue: "void-set-config-value",
  voidSidebarReady: "void-sidebar-ready",
  voidSetGlobalContext: "void-set-global-context",
  voidSetLocale: "void-set-locale",
  voidSetOllamaModel: "void-set-ollama-model",
  voidSetSessionContext: "void-set-session-context",
  voidSetTab: "void-set-tab",
  voidSetWorkspaceContext: "void-set-workspace-context",
  voidStartSymmetryProvider: "void-start-symmetry-provider",
  voidStopGeneration: "void-stop-generation",
  voidStopSymmetryProvider: "void-stop-symmetry-provider",
  voidSymmetryModels: "void-symmetry-models",
  voidGetSymmetryModels: "void-get-symmetry-models",
  voidTextSelection: "void-text-selection",
  voidGetModels: "void-get-models",
  voidUpdateContextItems: "void-update-context-items",
  voidGetContextItems: "void-get-context-items",
  voidRemoveContextItem: "void-remove-context-item"
}

export const CONVERSATION_EVENT_NAME = {
  clearAllConversations: "void.clear-all-conversations",
  getActiveConversation: "void.get-active-conversation",
  getConversations: "void.get-conversations",
  removeConversation: "void.remove-conversation",
  saveConversation: "void.save-conversation",
  saveLastConversation: "void.save-last-conversation",
  setActiveConversation: "void.set-active-conversation"
}

export const PROVIDER_EVENT_NAME = {
  addProvider: "void.add-provider",
  copyProvider: "void.copy-provider",
  focusProviderTab: "void.focus-provider-tab",
  getActiveChatProvider: "void.get-active-provider",
  getActiveEmbeddingsProvider: "void.get-active-embeddings-provider",
  getActiveFimProvider: "void.get-active-fim-provider",
  getAllProviders: "void.get-providers",
  removeProvider: "void.remove-provider",
  resetProvidersToDefaults: "void.reset-providers-to-defaults",
  exportProviders: "void.export-providers",
  importProviders: "void.import-providers",
  setActiveChatProvider: "void.set-active-chat-provider",
  setActiveEmbeddingsProvider: "void.set-active-embeddings-provider",
  setActiveFimProvider: "void.set-active-fim-provider",
  updateProvider: "void.update-provider",
  testProvider: "void.test-provider",
  testProviderResult: "void.test-provider-result"
}

export const GITHUB_EVENT_NAME = {
  getPullRequests: "github.getPullRequests",
  getPullRequestReview: "github.getPullRequestReview"
}

export const SYMMETRY_EMITTER_KEY = {
  inference: "inference"
}
