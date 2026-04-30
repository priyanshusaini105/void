import { ChatCompletionMessageParam, models } from "fluency.js"
import { serverMessageKeys } from "symmetry-core"
import * as vscode from "vscode"

import {
  ACTIVE_FIM_PROVIDER_STORAGE_KEY,
  EVENT_NAME,
  EXTENSION_SESSION_NAME,
  SYMMETRY_EMITTER_KEY,
  SYSTEM,
  VOID_COMMAND_NAME,
  WORKSPACE_STORAGE_KEY
} from "../../common/constants"
import { logger } from "../../common/logger"
import {
  AnyContextItem,
  ApiModel,
  ChatCompletionMessage,
  ClientMessage,
  InferenceRequest,
  LanguageType,
  ServerMessage,
  ThemeType
} from "../../common/types"
import { Chat } from "../chat"
import { ConversationHistory } from "../conversation-history"
import { DiffManager } from "../diff"
import { EmbeddingDatabase } from "../embeddings"
import { OllamaService } from "../ollama"
import { ProviderManager, TwinnyProvider } from "../provider-manager"
import { GithubService as ReviewService } from "../review-service"
import { SessionManager } from "../session-manager"
import { SymmetryService } from "../symmetry-service"
import { TemplateProvider } from "../template-provider"
import { FileTreeProvider } from "../tree"
import {
  createSymmetryMessage,
  getGitChanges,
  getLanguage,
  getTextSelection,
  getTheme
} from "../utils"

export class BaseProvider {
  private _diffManager = new DiffManager()
  private _embeddingDatabase: EmbeddingDatabase | undefined
  private _fileTreeProvider: FileTreeProvider
  private _ollamaService: OllamaService | undefined
  private _sessionManager: SessionManager | undefined
  private _statusBarItem: vscode.StatusBarItem
  private _symmetryService?: SymmetryService
  private _templateDir: string | undefined
  private _templateProvider: TemplateProvider
  public chat: Chat | undefined
  public context: vscode.ExtensionContext
  public conversationHistory: ConversationHistory | undefined
  public reviewService: ReviewService | undefined
  public webView?: vscode.Webview

  private _sidebarReadyHandler?: () => void

  public registerSidebarReadyHandler(handler: () => void) {
    this._sidebarReadyHandler = handler
  }

  constructor(
    context: vscode.ExtensionContext,
    templateDir: string,
    statusBar: vscode.StatusBarItem,
    db?: EmbeddingDatabase,
    sessionManager?: SessionManager
  ) {
    this.context = context
    this._fileTreeProvider = new FileTreeProvider()
    this._embeddingDatabase = db
    this._ollamaService = new OllamaService()
    this._sessionManager = sessionManager
    this._statusBarItem = statusBar
    this._templateDir = templateDir
    this._templateProvider = new TemplateProvider(templateDir)
  }

  public registerWebView(webView: vscode.Webview) {
    this.webView = webView
    this.initializeServices()
    this.registerEventListeners()
    logger.log("Webview registered successfully")
  }

  private initializeServices() {
    if (!this.webView) return
    this._symmetryService = new SymmetryService(
      this.webView,
      this._sessionManager,
      this.context
    )

    this.chat = new Chat(
      this._statusBarItem,
      this._templateDir,
      this.context,
      this.webView,
      this._embeddingDatabase,
      this._sessionManager,
      this._symmetryService
    )

    this.conversationHistory = new ConversationHistory(
      this.context,
      this.webView,
      this.chat
    )

    this.reviewService = new ReviewService(
      this.context,
      this.webView,
      this._templateDir,
      this.chat
    )

    new ProviderManager(this.context, this.webView)

    logger.log("Provider services initialized successfully")
  }

  private registerEventListeners() {
    vscode.window.onDidChangeActiveColorTheme(this.handleThemeChange)
    vscode.window.onDidChangeTextEditorSelection(this.handleTextSelection)

    const eventHandlers = {
      [EVENT_NAME.voidAcceptSolution]: this.acceptSolution,
      [EVENT_NAME.voidChatMessage]: this.streamChatCompletion,
      [EVENT_NAME.voidClickSuggestion]: this.clickSuggestion,
      [EVENT_NAME.voidEmbedDocuments]: this.embedDocuments,
      [EVENT_NAME.voidFetchOllamaModels]: this.fetchOllamaModels,
      [EVENT_NAME.voidGetConfigValue]: this.getConfigurationValue,
      [EVENT_NAME.voidGetGitChanges]: this.getGitCommitMessage,
      [EVENT_NAME.voidGetWorkspaceContext]: this.getTwinnyWorkspaceContext,
      [EVENT_NAME.voidGlobalContext]: this.getGlobalContext,
      [EVENT_NAME.voidHideBackButton]: this.voidHideBackButton,
      [EVENT_NAME.voidListTemplates]: this.listTemplates,
      [EVENT_NAME.voidNewDocument]: this.createNewUntitledDocument,
      [EVENT_NAME.voidNotification]: this.sendNotification,
      [EVENT_NAME.voidOpenDiff]: this.openDiff,
      [EVENT_NAME.voidSendLanguage]: this.getCurrentLanguage,
      [EVENT_NAME.voidSendTheme]: this.getTheme,
      [EVENT_NAME.voidSessionContext]: this.getSessionContext,
      [EVENT_NAME.voidSetConfigValue]: this.setConfigurationValue,
      [EVENT_NAME.voidSetGlobalContext]: this.setGlobalContext,
      [EVENT_NAME.voidSetTab]: this.setTab,
      [EVENT_NAME.voidSetWorkspaceContext]: this.setWorkspaceContext,
      [EVENT_NAME.voidTextSelection]: this.getSelectedText,
      [EVENT_NAME.voidFileListRequest]: this.fileListRequest,
      [EVENT_NAME.voidNewConversation]: this.voidNewConversation,
      [EVENT_NAME.voidEditDefaultTemplates]: this.editDefaultTemplates,
      [EVENT_NAME.twinntGetLocale]: this.sendLocaleToWebView,
      [EVENT_NAME.voidGetModels]: this.sendModelsToWebView,
      [EVENT_NAME.voidStopGeneration]: this.destroyStream,
      [EVENT_NAME.voidGetContextItems]: this.getContextItems,
      [EVENT_NAME.voidRemoveContextItem]: this.removeContextItem,
      [EVENT_NAME.voidSidebarReady]: this._sidebarReadyHandler,
      [VOID_COMMAND_NAME.settings]: this.openSettings
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.webView?.onDidReceiveMessage((message: any) => {
      const eventHandler = eventHandlers[message.type as string]
      if (eventHandler) eventHandler(message)
    })
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("void")) return
      this.sendLocaleToWebView()
    })
  }

  public getFimProvider = () => {
    return this.context.globalState.get<TwinnyProvider>(
      ACTIVE_FIM_PROVIDER_STORAGE_KEY
    )
  }

  private sendModelsToWebView = () => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidGetModels,
      data: models
    })
  }

  private sendLocaleToWebView = () => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidSetLocale,
      data: vscode.workspace.getConfiguration("void").get("locale") as string
    })
  }

  private handleThemeChange = () => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidSendTheme,
      data: getTheme()
    } as ServerMessage<ThemeType>)
  }

  private handleTextSelection = (
    event: vscode.TextEditorSelectionChangeEvent
  ) => {
    const text = event.textEditor.document.getText(event.selections[0])
    this.sendTextSelectionToWebView(text)
  }

  public newSymmetryConversation() {
    this._symmetryService?.write(
      createSymmetryMessage(serverMessageKeys.newConversation)
    )
  }

  public editDefaultTemplates = async () => {
    if (!this._templateDir) return
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(this._templateDir),
      true
    )
  }

  public destroyStream = () => {
    this.chat?.abort()
    this.reviewService?.abort()
    this.webView?.postMessage({
      type: EVENT_NAME.voidStopGeneration
    })
  }

  public async streamTemplateCompletion(template: string) {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.voidSymmetryConnection
    )
    if (symmetryConnected && this.chat) {
      const messages = await this.chat.getTemplateMessages(template)
      logger.log(`
        Using symmetry for inference
        Messages: ${JSON.stringify(messages)}
      `)
      return this._symmetryService?.write(
        createSymmetryMessage<InferenceRequest>(serverMessageKeys.inference, {
          messages,
          key: SYMMETRY_EMITTER_KEY.inference
        })
      )
    }
    this.chat?.templateCompletion(template)
  }

  addContextItem = (item: AnyContextItem) => {
    const items =
      this.context?.workspaceState.get<AnyContextItem[]>(
        WORKSPACE_STORAGE_KEY.contextItems
      ) || []
    const itemIndex = items.findIndex(
      (existingItem) => existingItem.id === item.id
    )
    let updatedItems
    if (itemIndex > -1) {
      updatedItems = [...items]
      updatedItems[itemIndex] = item
    } else {
      updatedItems = [...items, item]
    }
    this.saveContextItems(updatedItems)
    this.notifyContextUpdate(updatedItems)
  }

  getContextItems = () => {
    const items =
      this.context?.workspaceState.get<AnyContextItem[]>(
        WORKSPACE_STORAGE_KEY.contextItems
      ) || []
    this.notifyContextUpdate(items)
  }

  removeContextItem = (message: { data: string }) => {
    const items =
      this.context?.workspaceState.get<AnyContextItem[]>(
        WORKSPACE_STORAGE_KEY.contextItems
      ) || []
    const updatedItems = items.filter((item) => item.id !== message.data)
    this.saveContextItems(updatedItems)
    this.notifyContextUpdate(updatedItems)
  }

  private saveContextItems = (items: AnyContextItem[]) => {
    this.context?.workspaceState.update(
      WORKSPACE_STORAGE_KEY.contextItems,
      items
    )
  }

  private notifyContextUpdate = (items: AnyContextItem[]) => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidUpdateContextItems,
      data: items
    } as ServerMessage<AnyContextItem[]>)
  }

  public getGitCommitMessage = async () => {
    const diff = await getGitChanges()
    if (!diff.length) {
      vscode.window.showInformationMessage(
        "No changes found in the current workspace."
      )
      return
    }
    this.conversationHistory?.resetConversation()
  }

  private voidNewConversation = () => {
    this.conversationHistory?.resetConversation()
    this.newSymmetryConversation()
    this.webView?.postMessage({
      type: EVENT_NAME.voidNewConversation
    } as ServerMessage<string>)
  }

  private openSettings = () => {
    vscode.commands.executeCommand(VOID_COMMAND_NAME.settings)
  }

  private setTab = (tab: ClientMessage) => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidSetTab,
      data: tab
    } as ServerMessage<string>)
  }

  private embedDocuments = async () => {
    const dirs = vscode.workspace.workspaceFolders
    if (!dirs?.length) {
      vscode.window.showErrorMessage("No workspace loaded.")
      return
    }
    if (!this._embeddingDatabase) return
    for (const dir of dirs) {
      await this._embeddingDatabase.injestDocuments(dir.uri.fsPath)
    }
  }

  private getConfigurationValue = (message: ClientMessage) => {
    if (!message.key) return
    const config = vscode.workspace.getConfiguration("void")
    this.webView?.postMessage({
      type: EVENT_NAME.voidGetConfigValue,
      data: config.get(message.key)
    } as ServerMessage<string>)
  }

  private fileListRequest = async (message: ClientMessage) => {
    if (message.type === EVENT_NAME.voidFileListRequest) {
      const files = await this._fileTreeProvider?.getAllFiles()
      this.webView?.postMessage({
        type: EVENT_NAME.voidFileListResponse,
        data: files
      })
    }
  }

  private setConfigurationValue = (message: ClientMessage) => {
    if (!message.key) return
    const config = vscode.workspace.getConfiguration("void")
    config.update(message.key, message.data, vscode.ConfigurationTarget.Global)
  }

  private fetchOllamaModels = async () => {
    try {
      const models = await this._ollamaService?.fetchModels()
      if (!models?.length) {
        return
      }
      this.webView?.postMessage({
        type: EVENT_NAME.voidFetchOllamaModels,
        data: models
      } as ServerMessage<ApiModel[]>)
    } catch {
      return
    }
  }

  private listTemplates = () => {
    const templates = this._templateProvider.listTemplates()
    this.webView?.postMessage({
      type: EVENT_NAME.voidListTemplates,
      data: templates
    } as ServerMessage<string[]>)
  }

  private sendNotification = (message: ClientMessage) => {
    vscode.window.showInformationMessage(message.data as string)
  }

  private clickSuggestion = (message: ClientMessage) => {
    vscode.commands.executeCommand(
      "void.templateCompletion",
      message.data as string
    )
  }

  private streamChatCompletion = async (
    data: ClientMessage<ChatCompletionMessageParam[]>
  ) => {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.voidSymmetryConnection
    )
    if (symmetryConnected) {
      const systemMessage = {
        role: SYSTEM,
        content: await this._templateProvider?.readSystemMessageTemplate()
      }

      const messages = [
        systemMessage,
        ...(data.data as ChatCompletionMessage[])
      ].map((m) => ({
        ...m,
        content: m.content
      }))

      logger.log(`
        Using symmetry for inference
        Messages: ${JSON.stringify(messages)}
      `)

      return this._symmetryService?.write(
        createSymmetryMessage(serverMessageKeys.inference, {
          messages,
          key: SYMMETRY_EMITTER_KEY.inference
        })
      )
    }

    this.chat?.completion(
      data.data || [],
      data.meta as AnyContextItem[],
      data.key
    )
  }

  private getSelectedText = () => {
    this.sendTextSelectionToWebView(getTextSelection())
  }

  private openDiff = async (message: ClientMessage) => {
    await this._diffManager.openDiff(message)
  }

  private acceptSolution = async (message: ClientMessage) => {
    await this._diffManager.acceptSolution(message)
  }

  private createNewUntitledDocument = async (message: ClientMessage) => {
    const lang = getLanguage()
    const document = await vscode.workspace.openTextDocument({
      content: message.data as string,
      language: lang.languageId
    })
    await vscode.window.showTextDocument(document)
  }

  private getGlobalContext = (message: ClientMessage) => {
    const storedData = this.context?.globalState.get(
      `${EVENT_NAME.voidGlobalContext}-${message.key}`
    )
    this.webView?.postMessage({
      type: `${EVENT_NAME.voidGlobalContext}-${message.key}`,
      data: storedData
    })
  }

  private getTheme = () => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidSendTheme,
      data: getTheme()
    } as ServerMessage<ThemeType>)
  }

  private getCurrentLanguage = () => {
    this.webView?.postMessage({
      type: EVENT_NAME.voidSendLanguage,
      data: getLanguage()
    } as ServerMessage<LanguageType>)
  }

  private getSessionContext = (data: ClientMessage) => {
    if (!data.key) return undefined
    return this.webView?.postMessage({
      type: `${EVENT_NAME.voidSessionContext}-${data.key}`,
      data: this._sessionManager?.get(data.key)
    })
  }

  private setGlobalContext = (message: ClientMessage) => {
    this.context?.globalState.update(
      `${EVENT_NAME.voidGlobalContext}-${message.key}`,
      message.data
    )
  }

  private getTwinnyWorkspaceContext = (message: ClientMessage) => {
    const storedData = this.context?.workspaceState.get(
      `${EVENT_NAME.voidGetWorkspaceContext}-${message.key}`
    )
    this.webView?.postMessage({
      type: `${EVENT_NAME.voidGetWorkspaceContext}-${message.key}`,
      data: storedData
    } as ServerMessage)
  }

  private setWorkspaceContext = <T>(message: ClientMessage<T>) => {
    const data = message.data
    this.context.workspaceState.update(
      `${EVENT_NAME.voidGetWorkspaceContext}-${message.key}`,
      data
    )
    this.webView?.postMessage({
      type: `${EVENT_NAME.voidGetWorkspaceContext}-${message.key}`,
      data
    })
  }

  private voidHideBackButton() {
    vscode.commands.executeCommand(VOID_COMMAND_NAME.hideBackButton)
  }

  private sendTextSelectionToWebView(text: string) {
    this.webView?.postMessage({
      type: EVENT_NAME.voidTextSelection,
      data: text
    })
  }
}
