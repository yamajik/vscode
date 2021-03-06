/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/workbench/contrib/files/browser/files.contribution'; // load our contribution into the test
import { FileEditorInput } from 'vs/workbench/contrib/files/common/editors/fileEditorInput';
import { TestInstantiationService } from 'vs/platform/instantiation/test/common/instantiationServiceMock';
import { join } from 'vs/base/common/path';
import * as resources from 'vs/base/common/resources';
import { URI } from 'vs/base/common/uri';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { NullTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils';
import { ConfirmResult, IEditorInputWithOptions, CloseDirection, IEditorIdentifier, IUntitledResourceInput, IResourceDiffInput, IResourceSideBySideInput, IEditorInput, IEditor, IEditorCloseEvent, IEditorPartOptions } from 'vs/workbench/common/editor';
import { IEditorOpeningEvent, EditorServiceImpl, IEditorGroupView } from 'vs/workbench/browser/parts/editor/editor';
import { Event, Emitter } from 'vs/base/common/event';
import Severity from 'vs/base/common/severity';
import { IBackupFileService } from 'vs/workbench/services/backup/common/backup';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IWorkbenchLayoutService, Parts, Position as PartPosition } from 'vs/workbench/services/layout/browser/layoutService';
import { TextModelResolverService } from 'vs/workbench/services/textmodelResolver/common/textModelResolverService';
import { ITextModelService } from 'vs/editor/common/services/resolverService';
import { IEditorOptions, IResourceInput } from 'vs/platform/editor/common/editor';
import { IUntitledEditorService, UntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkspaceContextService, IWorkspace as IWorkbenchWorkspace, WorkbenchState, IWorkspaceFolder, IWorkspaceFoldersChangeEvent, Workspace } from 'vs/platform/workspace/common/workspace';
import { ILifecycleService, BeforeShutdownEvent, ShutdownReason, StartupKind, LifecyclePhase, WillShutdownEvent } from 'vs/platform/lifecycle/common/lifecycle';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { TextFileService } from 'vs/workbench/services/textfile/common/textFileService';
import { FileOperationEvent, IFileService, IResolveContentOptions, FileOperationError, IFileStat, IResolveFileResult, FileChangesEvent, IResolveFileOptions, IContent, IUpdateContentOptions, IStreamContent, ICreateFileOptions, ITextSnapshot, IResourceEncodings } from 'vs/platform/files/common/files';
import { IModelService } from 'vs/editor/common/services/modelService';
import { ModeServiceImpl } from 'vs/editor/common/services/modeServiceImpl';
import { ModelServiceImpl } from 'vs/editor/common/services/modelServiceImpl';
import { IRawTextContent, ITextFileService } from 'vs/workbench/services/textfile/common/textfiles';
import { parseArgs } from 'vs/platform/environment/node/argv';
import { EnvironmentService } from 'vs/platform/environment/node/environmentService';
import { IModeService } from 'vs/editor/common/services/modeService';
import { IHistoryService } from 'vs/workbench/services/history/common/history';
import { IInstantiationService, ServicesAccessor, ServiceIdentifier } from 'vs/platform/instantiation/common/instantiation';
import { TestConfigurationService } from 'vs/platform/configuration/test/common/testConfigurationService';
import { IWindowsService, IWindowService, INativeOpenDialogOptions, IEnterWorkspaceResult, IMessageBoxResult, IWindowConfiguration, MenuBarVisibility, IURIToOpen } from 'vs/platform/windows/common/windows';
import { TestWorkspace } from 'vs/platform/workspace/test/common/testWorkspace';
import { createTextBufferFactory } from 'vs/editor/common/model/textModel';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { TestThemeService } from 'vs/platform/theme/test/common/testThemeService';
import { IWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier, isSingleFolderWorkspaceIdentifier } from 'vs/platform/workspaces/common/workspaces';
import { IRecentlyOpened } from 'vs/platform/history/common/history';
import { ITextResourceConfigurationService, ITextResourcePropertiesService } from 'vs/editor/common/services/resourceConfiguration';
import { IPosition, Position as EditorPosition } from 'vs/editor/common/core/position';
import { IMenuService, MenuId, IMenu, ISerializableCommandAction } from 'vs/platform/actions/common/actions';
import { IHashService } from 'vs/workbench/services/hash/common/hashService';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { MockContextKeyService, MockKeybindingService } from 'vs/platform/keybinding/test/common/mockKeybindingService';
import { ITextBufferFactory, DefaultEndOfLine, EndOfLinePreference, IModelDecorationOptions, ITextModel } from 'vs/editor/common/model';
import { Range } from 'vs/editor/common/core/range';
import { IConfirmation, IConfirmationResult, IDialogService, IDialogOptions, IPickAndOpenOptions, ISaveDialogOptions, IOpenDialogOptions, IFileDialogService } from 'vs/platform/dialogs/common/dialogs';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { TestNotificationService } from 'vs/platform/notification/test/common/testNotificationService';
import { IExtensionService, NullExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IDecorationsService, IResourceDecorationChangeEvent, IDecoration, IDecorationData, IDecorationsProvider } from 'vs/workbench/services/decorations/browser/decorations';
import { IDisposable, toDisposable, Disposable } from 'vs/base/common/lifecycle';
import { IEditorGroupsService, IEditorGroup, GroupsOrder, GroupsArrangement, GroupDirection, IAddGroupOptions, IMergeGroupOptions, IMoveEditorOptions, ICopyEditorOptions, IEditorReplacement, IGroupChangeEvent, EditorsOrder, IFindGroupScope, EditorGroupLayout, ICloseEditorOptions } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorService, IOpenEditorOverrideHandler, IActiveEditor } from 'vs/workbench/services/editor/common/editorService';
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService';
import { ICodeEditor, IDiffEditor } from 'vs/editor/browser/editorBrowser';
import { IDecorationRenderOptions } from 'vs/editor/common/editorCommon';
import { EditorGroup } from 'vs/workbench/common/editor/editorGroup';
import { Dimension } from 'vs/base/browser/dom';
import { ILogService, LogLevel } from 'vs/platform/log/common/log';
import { ILabelService } from 'vs/platform/label/common/label';
import { timeout } from 'vs/base/common/async';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { ViewletDescriptor, Viewlet } from 'vs/workbench/browser/viewlet';
import { IViewlet } from 'vs/workbench/common/viewlet';
import { IStorageService, InMemoryStorageService } from 'vs/platform/storage/common/storage';
import { isLinux, isMacintosh } from 'vs/base/common/platform';
import { LabelService } from 'vs/workbench/services/label/common/labelService';
import { IDimension } from 'vs/platform/layout/browser/layoutService';
import { Part } from 'vs/workbench/browser/part';
import { IPanelService } from 'vs/workbench/services/panel/common/panelService';
import { IPanel } from 'vs/workbench/common/panel';
import { IBadge } from 'vs/workbench/services/activity/common/activity';

export function createFileInput(instantiationService: IInstantiationService, resource: URI): FileEditorInput {
	return instantiationService.createInstance(FileEditorInput, resource, undefined);
}

export const TestEnvironmentService = new EnvironmentService(parseArgs(process.argv), process.execPath);

export class TestContextService implements IWorkspaceContextService {
	public _serviceBrand: any;

	private workspace: Workspace;
	private options: any;

	private readonly _onDidChangeWorkspaceName: Emitter<void>;
	private readonly _onDidChangeWorkspaceFolders: Emitter<IWorkspaceFoldersChangeEvent>;
	private readonly _onDidChangeWorkbenchState: Emitter<WorkbenchState>;

	constructor(workspace: any = TestWorkspace, options: any = null) {
		this.workspace = workspace;
		this.options = options || Object.create(null);
		this._onDidChangeWorkspaceFolders = new Emitter<IWorkspaceFoldersChangeEvent>();
		this._onDidChangeWorkbenchState = new Emitter<WorkbenchState>();
	}

	public get onDidChangeWorkspaceName(): Event<void> {
		return this._onDidChangeWorkspaceName.event;
	}

	public get onDidChangeWorkspaceFolders(): Event<IWorkspaceFoldersChangeEvent> {
		return this._onDidChangeWorkspaceFolders.event;
	}

	public get onDidChangeWorkbenchState(): Event<WorkbenchState> {
		return this._onDidChangeWorkbenchState.event;
	}

	public getFolders(): IWorkspaceFolder[] {
		return this.workspace ? this.workspace.folders : [];
	}

	public getWorkbenchState(): WorkbenchState {
		if (this.workspace.configuration) {
			return WorkbenchState.WORKSPACE;
		}

		if (this.workspace.folders.length) {
			return WorkbenchState.FOLDER;
		}

		return WorkbenchState.EMPTY;
	}

	getCompleteWorkspace(): Promise<IWorkbenchWorkspace> {
		return Promise.resolve(this.getWorkspace());
	}

	public getWorkspace(): IWorkbenchWorkspace {
		return this.workspace;
	}

	public getWorkspaceFolder(resource: URI): IWorkspaceFolder | null {
		return this.workspace.getFolder(resource);
	}

	public setWorkspace(workspace: any): void {
		this.workspace = workspace;
	}

	public getOptions() {
		return this.options;
	}

	public updateOptions() {

	}

	public isInsideWorkspace(resource: URI): boolean {
		if (resource && this.workspace) {
			return resources.isEqualOrParent(resource, this.workspace.folders[0].uri);
		}

		return false;
	}

	public toResource(workspaceRelativePath: string): URI {
		return URI.file(join('C:\\', workspaceRelativePath));
	}

	public isCurrentWorkspace(workspaceIdentifier: ISingleFolderWorkspaceIdentifier | IWorkspaceIdentifier): boolean {
		return isSingleFolderWorkspaceIdentifier(workspaceIdentifier) && resources.isEqual(this.workspace.folders[0].uri, workspaceIdentifier);
	}
}

export class TestTextFileService extends TextFileService {
	public cleanupBackupsBeforeShutdownCalled: boolean;

	private promptPath: URI;
	private confirmResult: ConfirmResult;
	private resolveTextContentError: FileOperationError | null;

	constructor(
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IFileService protected fileService: IFileService,
		@IUntitledEditorService untitledEditorService: IUntitledEditorService,
		@ILifecycleService lifecycleService: ILifecycleService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
		@IModeService modeService: IModeService,
		@IModelService modelService: IModelService,
		@IWindowService windowService: IWindowService,
		@IEnvironmentService environmentService: IEnvironmentService,
		@INotificationService notificationService: INotificationService,
		@IBackupFileService backupFileService: IBackupFileService,
		@IWindowsService windowsService: IWindowsService,
		@IHistoryService historyService: IHistoryService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IDialogService dialogService: IDialogService,
		@IFileDialogService fileDialogService: IFileDialogService,
		@IEditorService editorService: IEditorService
	) {
		super(
			contextService,
			fileService,
			untitledEditorService,
			lifecycleService,
			instantiationService,
			configurationService,
			modeService,
			modelService,
			windowService,
			environmentService,
			notificationService,
			backupFileService,
			windowsService,
			historyService,
			contextKeyService,
			dialogService,
			fileDialogService,
			editorService
		);
	}

	public setPromptPath(path: URI): void {
		this.promptPath = path;
	}

	public setConfirmResult(result: ConfirmResult): void {
		this.confirmResult = result;
	}

	public setResolveTextContentErrorOnce(error: FileOperationError): void {
		this.resolveTextContentError = error;
	}

	public resolveTextContent(resource: URI, options?: IResolveContentOptions): Promise<IRawTextContent> {
		if (this.resolveTextContentError) {
			const error = this.resolveTextContentError;
			this.resolveTextContentError = null;

			return Promise.reject(error);
		}

		return this.fileService.resolveContent(resource, options).then((content): IRawTextContent => {
			return {
				resource: content.resource,
				name: content.name,
				mtime: content.mtime,
				etag: content.etag,
				encoding: content.encoding,
				value: createTextBufferFactory(content.value)
			};
		});
	}

	public promptForPath(_resource: URI, _defaultPath: URI): Promise<URI> {
		return Promise.resolve(this.promptPath);
	}

	public confirmSave(_resources?: URI[]): Promise<ConfirmResult> {
		return Promise.resolve(this.confirmResult);
	}

	public confirmOverwrite(_resource: URI): Promise<boolean> {
		return Promise.resolve(true);
	}

	public onFilesConfigurationChange(configuration: any): void {
		super.onFilesConfigurationChange(configuration);
	}

	protected cleanupBackupsBeforeShutdown(): Promise<void> {
		this.cleanupBackupsBeforeShutdownCalled = true;
		return Promise.resolve();
	}
}

export function workbenchInstantiationService(): IInstantiationService {
	let instantiationService = new TestInstantiationService(new ServiceCollection([ILifecycleService, new TestLifecycleService()]));
	instantiationService.stub(IEnvironmentService, TestEnvironmentService);
	instantiationService.stub(IContextKeyService, <IContextKeyService>instantiationService.createInstance(MockContextKeyService));
	const workspaceContextService = new TestContextService(TestWorkspace);
	instantiationService.stub(IWorkspaceContextService, workspaceContextService);
	const configService = new TestConfigurationService();
	instantiationService.stub(IConfigurationService, configService);
	instantiationService.stub(ITextResourceConfigurationService, new TestTextResourceConfigurationService(configService));
	instantiationService.stub(IUntitledEditorService, instantiationService.createInstance(UntitledEditorService));
	instantiationService.stub(IStorageService, new TestStorageService());
	instantiationService.stub(IWorkbenchLayoutService, new TestLayoutService());
	instantiationService.stub(IModeService, instantiationService.createInstance(ModeServiceImpl));
	instantiationService.stub(IHistoryService, new TestHistoryService());
	instantiationService.stub(ITextResourcePropertiesService, new TestTextResourcePropertiesService(configService));
	instantiationService.stub(IModelService, instantiationService.createInstance(ModelServiceImpl));
	instantiationService.stub(IFileService, new TestFileService());
	instantiationService.stub(IBackupFileService, new TestBackupFileService());
	instantiationService.stub(ITelemetryService, NullTelemetryService);
	instantiationService.stub(INotificationService, new TestNotificationService());
	instantiationService.stub(IUntitledEditorService, instantiationService.createInstance(UntitledEditorService));
	instantiationService.stub(IWindowService, new TestWindowService());
	instantiationService.stub(IMenuService, new TestMenuService());
	instantiationService.stub(IKeybindingService, new MockKeybindingService());
	instantiationService.stub(IDecorationsService, new TestDecorationsService());
	instantiationService.stub(IExtensionService, new TestExtensionService());
	instantiationService.stub(IWindowsService, new TestWindowsService());
	instantiationService.stub(ITextFileService, <ITextFileService>instantiationService.createInstance(TestTextFileService));
	instantiationService.stub(ITextModelService, <ITextModelService>instantiationService.createInstance(TextModelResolverService));
	instantiationService.stub(IThemeService, new TestThemeService());
	instantiationService.stub(IHashService, new TestHashService());
	instantiationService.stub(ILogService, new TestLogService());
	instantiationService.stub(IEditorGroupsService, new TestEditorGroupsService([new TestEditorGroup(0)]));
	instantiationService.stub(ILabelService, <ILabelService>instantiationService.createInstance(LabelService));
	const editorService = new TestEditorService();
	instantiationService.stub(IEditorService, editorService);
	instantiationService.stub(ICodeEditorService, new TestCodeEditorService());
	instantiationService.stub(IViewletService, new TestViewletService());

	return instantiationService;
}

export class TestLogService implements ILogService {
	_serviceBrand: any; onDidChangeLogLevel: Event<LogLevel>;
	getLevel(): LogLevel { return LogLevel.Info; }
	setLevel(_level: LogLevel): void { }
	trace(_message: string, ..._args: any[]): void { }
	debug(_message: string, ..._args: any[]): void { }
	info(_message: string, ..._args: any[]): void { }
	warn(_message: string, ..._args: any[]): void { }
	error(_message: string | Error, ..._args: any[]): void { }
	critical(_message: string | Error, ..._args: any[]): void { }
	dispose(): void { }
}

export class TestDecorationsService implements IDecorationsService {
	_serviceBrand: any;
	onDidChangeDecorations: Event<IResourceDecorationChangeEvent> = Event.None;
	registerDecorationsProvider(_provider: IDecorationsProvider): IDisposable { return Disposable.None; }
	getDecoration(_uri: URI, _includeChildren: boolean, _overwrite?: IDecorationData): IDecoration | undefined { return undefined; }
}

export class TestExtensionService extends NullExtensionService { }

export class TestMenuService implements IMenuService {

	public _serviceBrand: any;

	createMenu(_id: MenuId, _scopedKeybindingService: IContextKeyService): IMenu {
		return {
			onDidChange: Event.None,
			dispose: () => undefined,
			getActions: () => []
		};
	}
}

export class TestHistoryService implements IHistoryService {

	public _serviceBrand: any;

	constructor(private root?: URI) {
	}

	public reopenLastClosedEditor(): void {
	}

	public forward(_acrossEditors?: boolean): void {
	}

	public back(_acrossEditors?: boolean): void {
	}

	public last(): void {
	}

	public remove(_input: IEditorInput | IResourceInput): void {
	}

	public clear(): void {
	}

	public clearRecentlyOpened(): void {
	}

	public getHistory(): Array<IEditorInput | IResourceInput> {
		return [];
	}

	public getLastActiveWorkspaceRoot(_schemeFilter: string): URI | undefined {
		return this.root;
	}

	public getLastActiveFile(_schemeFilter: string): URI | undefined {
		return undefined;
	}

	public openLastEditLocation(): void {
	}
}

export class TestDialogService implements IDialogService {

	public _serviceBrand: any;

	public confirm(_confirmation: IConfirmation): Promise<IConfirmationResult> {
		return Promise.resolve({ confirmed: false });
	}

	public show(_severity: Severity, _message: string, _buttons: string[], _options?: IDialogOptions): Promise<number> {
		return Promise.resolve(0);
	}
}

export class TestFileDialogService implements IFileDialogService {

	public _serviceBrand: any;

	public defaultFilePath(_schemeFilter?: string): URI | undefined {
		return undefined;
	}
	public defaultFolderPath(_schemeFilter?: string): URI | undefined {
		return undefined;
	}
	public defaultWorkspacePath(_schemeFilter?: string): URI | undefined {
		return undefined;
	}
	public pickFileFolderAndOpen(_options: IPickAndOpenOptions): Promise<any> {
		return Promise.resolve(0);
	}
	public pickFileAndOpen(_options: IPickAndOpenOptions): Promise<any> {
		return Promise.resolve(0);
	}
	public pickFolderAndOpen(_options: IPickAndOpenOptions): Promise<any> {
		return Promise.resolve(0);
	}
	public pickWorkspaceAndOpen(_options: IPickAndOpenOptions): Promise<any> {
		return Promise.resolve(0);
	}
	public showSaveDialog(_options: ISaveDialogOptions): Promise<URI | undefined> {
		return Promise.resolve(undefined);
	}
	public showOpenDialog(_options: IOpenDialogOptions): Promise<URI[] | undefined> {
		return Promise.resolve(undefined);
	}
}

export class TestLayoutService implements IWorkbenchLayoutService {

	public _serviceBrand: any;

	dimension: IDimension = { width: 800, height: 600 };

	onZenModeChange: Event<boolean> = Event.None;
	onLayout = Event.None;

	private _onTitleBarVisibilityChange = new Emitter<void>();
	private _onMenubarVisibilityChange = new Emitter<Dimension>();

	public get onTitleBarVisibilityChange(): Event<void> {
		return this._onTitleBarVisibilityChange.event;
	}

	public get onMenubarVisibilityChange(): Event<Dimension> {
		return this._onMenubarVisibilityChange.event;
	}

	public isRestored(): boolean {
		return true;
	}

	public hasFocus(_part: Parts): boolean {
		return false;
	}

	public isVisible(_part: Parts): boolean {
		return true;
	}

	public getContainer(_part: Parts): HTMLElement | null {
		return null;
	}

	public isTitleBarHidden(): boolean {
		return false;
	}

	public getTitleBarOffset(): number {
		return 0;
	}

	public isStatusBarHidden(): boolean {
		return false;
	}

	public isActivityBarHidden(): boolean {
		return false;
	}

	public setActivityBarHidden(_hidden: boolean): void { }

	public isSideBarHidden(): boolean {
		return false;
	}

	public setEditorHidden(_hidden: boolean): Promise<void> { return Promise.resolve(); }

	public setSideBarHidden(_hidden: boolean): Promise<void> { return Promise.resolve(); }

	public isPanelHidden(): boolean {
		return false;
	}

	public setPanelHidden(_hidden: boolean): Promise<void> { return Promise.resolve(); }

	public toggleMaximizedPanel(): void { }

	public isPanelMaximized(): boolean {
		return false;
	}

	public getMenubarVisibility(): MenuBarVisibility {
		throw new Error('not implemented');
	}

	public getSideBarPosition() {
		return 0;
	}

	public getPanelPosition() {
		return 0;
	}

	public setPanelPosition(_position: PartPosition): Promise<void> {
		return Promise.resolve();
	}

	public addClass(_clazz: string): void { }
	public removeClass(_clazz: string): void { }
	public getWorkbenchElement(): HTMLElement { throw new Error('not implemented'); }

	public toggleZenMode(): void { }

	public isEditorLayoutCentered(): boolean { return false; }
	public centerEditorLayout(_active: boolean): void { }


	public resizePart(_part: Parts, _sizeChange: number): void { }

	public registerPart(part: Part): void { }
}

let activeViewlet: Viewlet = {} as any;

export class TestViewletService implements IViewletService {
	public _serviceBrand: any;

	onDidViewletRegisterEmitter = new Emitter<ViewletDescriptor>();
	onDidViewletDeregisterEmitter = new Emitter<ViewletDescriptor>();
	onDidViewletOpenEmitter = new Emitter<IViewlet>();
	onDidViewletCloseEmitter = new Emitter<IViewlet>();

	onDidViewletRegister = this.onDidViewletRegisterEmitter.event;
	onDidViewletDeregister = this.onDidViewletDeregisterEmitter.event;
	onDidViewletOpen = this.onDidViewletOpenEmitter.event;
	onDidViewletClose = this.onDidViewletCloseEmitter.event;

	public openViewlet(id: string, focus?: boolean): Promise<IViewlet> {
		return Promise.resolve(null!);
	}

	public getViewlets(): ViewletDescriptor[] {
		return [];
	}

	public getAllViewlets(): ViewletDescriptor[] {
		return [];
	}

	public getActiveViewlet(): IViewlet {
		return activeViewlet;
	}

	public dispose() {
	}

	public getDefaultViewletId(): string {
		return 'workbench.view.explorer';
	}

	public getViewlet(id: string): ViewletDescriptor | undefined {
		return undefined;
	}

	public getProgressIndicator(id: string) {
		return null!;
	}

	public hideActiveViewlet(): void { }

	public getLastActiveViewletId(): string {
		return undefined;
	}
}

export class TestPanelService implements IPanelService {
	public _serviceBrand: any;

	onDidPanelOpen = new Emitter<{ panel: IPanel, focus: boolean }>().event;
	onDidPanelClose = new Emitter<IPanel>().event;

	public openPanel(id: string, focus?: boolean): IPanel {
		return null!;
	}

	public getPanels(): any[] {
		return [];
	}

	public getPinnedPanels(): any[] {
		return [];
	}

	public getActivePanel(): IViewlet {
		return activeViewlet;
	}

	public setPanelEnablement(id: string, enabled: boolean): void { }

	public dispose() {
	}

	public showActivity(panelId: string, badge: IBadge, clazz?: string): IDisposable {
		throw new Error('Method not implemented.');
	}

	public hideActivePanel(): void { }

	public getLastActivePanelId(): string {
		return undefined;
	}
}

export class TestStorageService extends InMemoryStorageService { }

export class TestEditorGroupsService implements IEditorGroupsService {

	_serviceBrand: ServiceIdentifier<any>;

	constructor(public groups: TestEditorGroup[] = []) { }

	onDidActiveGroupChange: Event<IEditorGroup> = Event.None;
	onDidActivateGroup: Event<IEditorGroup> = Event.None;
	onDidAddGroup: Event<IEditorGroup> = Event.None;
	onDidRemoveGroup: Event<IEditorGroup> = Event.None;
	onDidMoveGroup: Event<IEditorGroup> = Event.None;
	onDidLayout: Event<IDimension> = Event.None;

	orientation: any;
	whenRestored: Promise<void> = Promise.resolve(undefined);

	get activeGroup(): IEditorGroup {
		return this.groups[0];
	}

	get count(): number {
		return this.groups.length;
	}

	getGroups(_order?: GroupsOrder): ReadonlyArray<IEditorGroup> {
		return this.groups;
	}

	getGroup(identifier: number): IEditorGroup {
		for (const group of this.groups) {
			if (group.id === identifier) {
				return group;
			}
		}

		return undefined!;
	}

	getLabel(_identifier: number): string {
		return 'Group 1';
	}

	findGroup(_scope: IFindGroupScope, _source?: number | IEditorGroup, _wrap?: boolean): IEditorGroup {
		throw new Error('not implemented');
	}

	activateGroup(_group: number | IEditorGroup): IEditorGroup {
		throw new Error('not implemented');
	}

	getSize(_group: number | IEditorGroup): number {
		return 100;
	}

	setSize(_group: number | IEditorGroup, _size: number): void { }

	arrangeGroups(_arrangement: GroupsArrangement): void { }

	applyLayout(_layout: EditorGroupLayout): void { }

	setGroupOrientation(_orientation: any): void { }

	addGroup(_location: number | IEditorGroup, _direction: GroupDirection, _options?: IAddGroupOptions): IEditorGroup {
		throw new Error('not implemented');
	}

	removeGroup(_group: number | IEditorGroup): void { }

	moveGroup(_group: number | IEditorGroup, _location: number | IEditorGroup, _direction: GroupDirection): IEditorGroup {
		throw new Error('not implemented');
	}

	mergeGroup(_group: number | IEditorGroup, _target: number | IEditorGroup, _options?: IMergeGroupOptions): IEditorGroup {
		throw new Error('not implemented');
	}

	copyGroup(_group: number | IEditorGroup, _location: number | IEditorGroup, _direction: GroupDirection): IEditorGroup {
		throw new Error('not implemented');
	}

	centerLayout(active: boolean): void { }

	isLayoutCentered(): boolean {
		return false;
	}

	partOptions: IEditorPartOptions;
	enforcePartOptions(options: IEditorPartOptions): IDisposable {
		return Disposable.None;
	}
}

export class TestEditorGroup implements IEditorGroupView {

	constructor(public id: number) { }

	get group(): EditorGroup { throw new Error('not implemented'); }
	activeControl: IActiveEditor;
	activeEditor: IEditorInput;
	previewEditor: IEditorInput;
	count: number;
	disposed: boolean;
	editors: ReadonlyArray<IEditorInput> = [];
	label: string;
	whenRestored: Promise<void> = Promise.resolve(undefined);
	element: HTMLElement;
	minimumWidth: number;
	maximumWidth: number;
	minimumHeight: number;
	maximumHeight: number;

	onWillDispose: Event<void> = Event.None;
	onDidGroupChange: Event<IGroupChangeEvent> = Event.None;
	onWillCloseEditor: Event<IEditorCloseEvent> = Event.None;
	onDidCloseEditor: Event<IEditorCloseEvent> = Event.None;
	onWillOpenEditor: Event<IEditorOpeningEvent> = Event.None;
	onDidOpenEditorFail: Event<IEditorInput> = Event.None;
	onDidFocus: Event<void> = Event.None;
	onDidChange: Event<{ width: number; height: number; }> = Event.None;

	getEditors(_order?: EditorsOrder): ReadonlyArray<IEditorInput> {
		return [];
	}

	getEditor(_index: number): IEditorInput {
		throw new Error('not implemented');
	}

	getIndexOfEditor(_editor: IEditorInput): number {
		return -1;
	}

	openEditor(_editor: IEditorInput, _options?: IEditorOptions): Promise<IEditor> {
		throw new Error('not implemented');
	}

	openEditors(_editors: IEditorInputWithOptions[]): Promise<IEditor> {
		throw new Error('not implemented');
	}

	isOpened(_editor: IEditorInput): boolean {
		return false;
	}

	isPinned(_editor: IEditorInput): boolean {
		return false;
	}

	isActive(_editor: IEditorInput): boolean {
		return false;
	}

	moveEditor(_editor: IEditorInput, _target: IEditorGroup, _options?: IMoveEditorOptions): void { }

	copyEditor(_editor: IEditorInput, _target: IEditorGroup, _options?: ICopyEditorOptions): void { }

	closeEditor(_editor?: IEditorInput, options?: ICloseEditorOptions): Promise<void> {
		return Promise.resolve();
	}

	closeEditors(_editors: IEditorInput[] | { except?: IEditorInput; direction?: CloseDirection; savedOnly?: boolean; }, options?: ICloseEditorOptions): Promise<void> {
		return Promise.resolve();
	}

	closeAllEditors(): Promise<void> {
		return Promise.resolve();
	}

	replaceEditors(_editors: IEditorReplacement[]): Promise<void> {
		return Promise.resolve();
	}

	pinEditor(_editor?: IEditorInput): void { }

	focus(): void { }

	invokeWithinContext<T>(fn: (accessor: ServicesAccessor) => T): T {
		throw new Error('not implemented');
	}

	isEmpty(): boolean { return true; }
	setActive(_isActive: boolean): void { }
	setLabel(_label: string): void { }
	dispose(): void { }
	toJSON(): object { return Object.create(null); }
	layout(_width: number, _height: number): void { }
	relayout() { }
}

export class TestEditorService implements EditorServiceImpl {

	_serviceBrand: ServiceIdentifier<any>;

	onDidActiveEditorChange: Event<void> = Event.None;
	onDidVisibleEditorsChange: Event<void> = Event.None;
	onDidCloseEditor: Event<IEditorCloseEvent> = Event.None;
	onDidOpenEditorFail: Event<IEditorIdentifier> = Event.None;

	activeControl: IActiveEditor;
	activeTextEditorWidget: any;
	activeEditor: IEditorInput;
	editors: ReadonlyArray<IEditorInput> = [];
	visibleControls: ReadonlyArray<IEditor> = [];
	visibleTextEditorWidgets = [];
	visibleEditors: ReadonlyArray<IEditorInput> = [];

	overrideOpenEditor(_handler: IOpenEditorOverrideHandler): IDisposable {
		return toDisposable(() => undefined);
	}

	openEditor(_editor: any, _options?: any, _group?: any): Promise<any> {
		throw new Error('not implemented');
	}

	openEditors(_editors: any, _group?: any): Promise<IEditor[]> {
		throw new Error('not implemented');
	}

	isOpen(_editor: IEditorInput | IResourceInput | IUntitledResourceInput): boolean {
		return false;
	}

	getOpened(_editor: IEditorInput | IResourceInput | IUntitledResourceInput): IEditorInput {
		throw new Error('not implemented');
	}

	replaceEditors(_editors: any, _group: any) {
		return Promise.resolve(undefined);
	}

	invokeWithinEditorContext<T>(fn: (accessor: ServicesAccessor) => T): T {
		throw new Error('not implemented');
	}

	createInput(_input: IResourceInput | IUntitledResourceInput | IResourceDiffInput | IResourceSideBySideInput): IEditorInput {
		throw new Error('not implemented');
	}
}

export class TestFileService implements IFileService {

	public _serviceBrand: any;

	public encoding: IResourceEncodings;

	private readonly _onFileChanges: Emitter<FileChangesEvent>;
	private readonly _onAfterOperation: Emitter<FileOperationEvent>;

	private content = 'Hello Html';

	constructor() {
		this._onFileChanges = new Emitter<FileChangesEvent>();
		this._onAfterOperation = new Emitter<FileOperationEvent>();
	}

	public setContent(content: string): void {
		this.content = content;
	}

	public getContent(): string {
		return this.content;
	}

	public get onFileChanges(): Event<FileChangesEvent> {
		return this._onFileChanges.event;
	}

	public fireFileChanges(event: FileChangesEvent): void {
		this._onFileChanges.fire(event);
	}

	public get onAfterOperation(): Event<FileOperationEvent> {
		return this._onAfterOperation.event;
	}

	public fireAfterOperation(event: FileOperationEvent): void {
		this._onAfterOperation.fire(event);
	}

	resolveFile(resource: URI, _options?: IResolveFileOptions): Promise<IFileStat> {
		return Promise.resolve({
			resource,
			etag: Date.now().toString(),
			encoding: 'utf8',
			mtime: Date.now(),
			isDirectory: false,
			name: resources.basename(resource)
		});
	}

	resolveFiles(toResolve: { resource: URI, options?: IResolveFileOptions }[]): Promise<IResolveFileResult[]> {
		return Promise.all(toResolve.map(resourceAndOption => this.resolveFile(resourceAndOption.resource, resourceAndOption.options))).then(stats => stats.map(stat => ({ stat, success: true })));
	}

	existsFile(_resource: URI): Promise<boolean> {
		return Promise.resolve(true);
	}

	resolveContent(resource: URI, _options?: IResolveContentOptions): Promise<IContent> {
		return Promise.resolve({
			resource: resource,
			value: this.content,
			etag: 'index.txt',
			encoding: 'utf8',
			mtime: Date.now(),
			name: resources.basename(resource)
		});
	}

	resolveStreamContent(resource: URI, _options?: IResolveContentOptions): Promise<IStreamContent> {
		return Promise.resolve({
			resource: resource,
			value: {
				on: (event: string, callback: Function): void => {
					if (event === 'data') {
						callback(this.content);
					}
					if (event === 'end') {
						callback();
					}
				}
			},
			etag: 'index.txt',
			encoding: 'utf8',
			mtime: Date.now(),
			name: resources.basename(resource)
		});
	}

	updateContent(resource: URI, _value: string | ITextSnapshot, _options?: IUpdateContentOptions): Promise<IFileStat> {
		return timeout(0).then(() => ({
			resource,
			etag: 'index.txt',
			encoding: 'utf8',
			mtime: Date.now(),
			isDirectory: false,
			name: resources.basename(resource)
		}));
	}

	moveFile(_source: URI, _target: URI, _overwrite?: boolean): Promise<IFileStat> {
		return Promise.resolve(null!);
	}

	copyFile(_source: URI, _target: URI, _overwrite?: boolean): Promise<IFileStat> {
		throw new Error('not implemented');
	}

	createFile(_resource: URI, _content?: string, _options?: ICreateFileOptions): Promise<IFileStat> {
		throw new Error('not implemented');
	}

	readFolder(_resource: URI) {
		return Promise.resolve([]);
	}

	createFolder(_resource: URI): Promise<IFileStat> {
		throw new Error('not implemented');
	}

	onDidChangeFileSystemProviderRegistrations = Event.None;

	registerProvider(_scheme: string, _provider) {
		return { dispose() { } };
	}

	activateProvider(_scheme: string): Promise<void> {
		throw new Error('not implemented');
	}

	canHandleResource(resource: URI): boolean {
		return resource.scheme === 'file';
	}

	del(_resource: URI, _options?: { useTrash?: boolean, recursive?: boolean }): Promise<void> {
		return Promise.resolve();
	}

	watchFileChanges(_resource: URI): void {
	}

	unwatchFileChanges(_resource: URI): void {
	}

	getWriteEncoding(_resource: URI): string {
		return 'utf8';
	}

	dispose(): void {
	}
}

export class TestBackupFileService implements IBackupFileService {
	public _serviceBrand: any;

	public hasBackups(): Promise<boolean> {
		return Promise.resolve(false);
	}

	public hasBackup(_resource: URI): Promise<boolean> {
		return Promise.resolve(false);
	}

	public loadBackupResource(resource: URI): Promise<URI | undefined> {
		return this.hasBackup(resource).then(hasBackup => {
			if (hasBackup) {
				return this.toBackupResource(resource);
			}

			return undefined;
		});
	}

	public registerResourceForBackup(_resource: URI): Promise<void> {
		return Promise.resolve();
	}

	public deregisterResourceForBackup(_resource: URI): Promise<void> {
		return Promise.resolve();
	}

	public toBackupResource(_resource: URI): URI {
		throw new Error('not implemented');
	}

	public backupResource(_resource: URI, _content: ITextSnapshot): Promise<void> {
		return Promise.resolve();
	}

	public getWorkspaceFileBackups(): Promise<URI[]> {
		return Promise.resolve([]);
	}

	public parseBackupContent(textBufferFactory: ITextBufferFactory): string {
		const textBuffer = textBufferFactory.create(DefaultEndOfLine.LF);
		const lineCount = textBuffer.getLineCount();
		const range = new Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
		return textBuffer.getValueInRange(range, EndOfLinePreference.TextDefined);
	}

	public resolveBackupContent(_backup: URI): Promise<ITextBufferFactory> {
		throw new Error('not implemented');
	}

	public discardResourceBackup(_resource: URI): Promise<void> {
		return Promise.resolve();
	}

	public discardAllWorkspaceBackups(): Promise<void> {
		return Promise.resolve();
	}
}

export class TestCodeEditorService implements ICodeEditorService {
	_serviceBrand: any;

	onCodeEditorAdd: Event<ICodeEditor> = Event.None;
	onCodeEditorRemove: Event<ICodeEditor> = Event.None;
	onDiffEditorAdd: Event<IDiffEditor> = Event.None;
	onDiffEditorRemove: Event<IDiffEditor> = Event.None;
	onDidChangeTransientModelProperty: Event<ITextModel> = Event.None;

	addCodeEditor(_editor: ICodeEditor): void { }
	removeCodeEditor(_editor: ICodeEditor): void { }
	listCodeEditors(): ICodeEditor[] { return []; }
	addDiffEditor(_editor: IDiffEditor): void { }
	removeDiffEditor(_editor: IDiffEditor): void { }
	listDiffEditors(): IDiffEditor[] { return []; }
	getFocusedCodeEditor(): ICodeEditor | null { return null; }
	registerDecorationType(_key: string, _options: IDecorationRenderOptions, _parentTypeKey?: string): void { }
	removeDecorationType(_key: string): void { }
	resolveDecorationOptions(_typeKey: string, _writable: boolean): IModelDecorationOptions { return Object.create(null); }
	setTransientModelProperty(_model: ITextModel, _key: string, _value: any): void { }
	getTransientModelProperty(_model: ITextModel, _key: string) { }
	getActiveCodeEditor(): ICodeEditor | null { return null; }
	openCodeEditor(_input: IResourceInput, _source: ICodeEditor, _sideBySide?: boolean): Promise<ICodeEditor | null> { return Promise.resolve(null); }
}

export class TestWindowService implements IWindowService {

	public _serviceBrand: any;

	onDidChangeFocus: Event<boolean> = new Emitter<boolean>().event;
	onDidChangeMaximize: Event<boolean>;

	hasFocus = true;

	isFocused(): Promise<boolean> {
		return Promise.resolve(false);
	}

	isMaximized(): Promise<boolean> {
		return Promise.resolve(false);
	}

	getConfiguration(): IWindowConfiguration {
		return Object.create(null);
	}

	getCurrentWindowId(): number {
		return 0;
	}

	pickFileFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickFileAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickWorkspaceAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	reloadWindow(): Promise<void> {
		return Promise.resolve();
	}

	openDevTools(): Promise<void> {
		return Promise.resolve();
	}

	toggleDevTools(): Promise<void> {
		return Promise.resolve();
	}

	closeWorkspace(): Promise<void> {
		return Promise.resolve();
	}

	enterWorkspace(_path: URI): Promise<IEnterWorkspaceResult | undefined> {
		return Promise.resolve(undefined);
	}

	toggleFullScreen(): Promise<void> {
		return Promise.resolve();
	}

	setRepresentedFilename(_fileName: string): Promise<void> {
		return Promise.resolve();
	}

	getRecentlyOpened(): Promise<IRecentlyOpened> {
		return Promise.resolve({
			workspaces: [],
			files: []
		});
	}

	focusWindow(): Promise<void> {
		return Promise.resolve();
	}

	maximizeWindow(): Promise<void> {
		return Promise.resolve();
	}

	unmaximizeWindow(): Promise<void> {
		return Promise.resolve();
	}

	minimizeWindow(): Promise<void> {
		return Promise.resolve();
	}

	openWindow(_uris: IURIToOpen[], _options?: { forceNewWindow?: boolean, forceReuseWindow?: boolean, forceOpenWorkspaceAsFile?: boolean }): Promise<void> {
		return Promise.resolve();
	}

	closeWindow(): Promise<void> {
		return Promise.resolve();
	}

	setDocumentEdited(_flag: boolean): Promise<void> {
		return Promise.resolve();
	}

	onWindowTitleDoubleClick(): Promise<void> {
		return Promise.resolve();
	}

	show(): Promise<void> {
		return Promise.resolve();
	}

	showMessageBox(_options: Electron.MessageBoxOptions): Promise<IMessageBoxResult> {
		return Promise.resolve({ button: 0 });
	}

	showSaveDialog(_options: Electron.SaveDialogOptions): Promise<string> {
		throw new Error('not implemented');
	}

	showOpenDialog(_options: Electron.OpenDialogOptions): Promise<string[]> {
		throw new Error('not implemented');
	}

	updateTouchBar(_items: ISerializableCommandAction[][]): Promise<void> {
		return Promise.resolve();
	}

	resolveProxy(url: string): Promise<string | undefined> {
		return Promise.resolve(undefined);
	}
}

export class TestLifecycleService implements ILifecycleService {

	public _serviceBrand: any;

	public phase: LifecyclePhase;
	public startupKind: StartupKind;

	private _onBeforeShutdown = new Emitter<BeforeShutdownEvent>();
	private _onWillShutdown = new Emitter<WillShutdownEvent>();
	private _onShutdown = new Emitter<void>();

	when(): Promise<void> {
		return Promise.resolve();
	}

	public fireShutdown(reason = ShutdownReason.QUIT): void {
		this._onWillShutdown.fire({
			join: () => { },
			reason
		});
	}

	public fireWillShutdown(event: BeforeShutdownEvent): void {
		this._onBeforeShutdown.fire(event);
	}

	public get onBeforeShutdown(): Event<BeforeShutdownEvent> {
		return this._onBeforeShutdown.event;
	}

	public get onWillShutdown(): Event<WillShutdownEvent> {
		return this._onWillShutdown.event;
	}

	public get onShutdown(): Event<void> {
		return this._onShutdown.event;
	}
}

export class TestWindowsService implements IWindowsService {

	_serviceBrand: any;

	public windowCount = 1;

	onWindowOpen: Event<number>;
	onWindowFocus: Event<number>;
	onWindowBlur: Event<number>;
	onWindowMaximize: Event<number>;
	onWindowUnmaximize: Event<number>;
	onRecentlyOpenedChange: Event<void>;

	isFocused(_windowId: number): Promise<boolean> {
		return Promise.resolve(false);
	}

	pickFileFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickFileAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	pickWorkspaceAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		return Promise.resolve();
	}

	reloadWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	openDevTools(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	toggleDevTools(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	closeWorkspace(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	enterWorkspace(_windowId: number, _path: URI): Promise<IEnterWorkspaceResult | undefined> {
		return Promise.resolve(undefined);
	}

	toggleFullScreen(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	setRepresentedFilename(_windowId: number, _fileName: string): Promise<void> {
		return Promise.resolve();
	}

	addRecentlyOpened(_workspaces: URI[], _folders: URI[], _files: URI[]): Promise<void> {
		return Promise.resolve();
	}

	removeFromRecentlyOpened(_paths: URI[]): Promise<void> {
		return Promise.resolve();
	}

	clearRecentlyOpened(): Promise<void> {
		return Promise.resolve();
	}

	getRecentlyOpened(_windowId: number): Promise<IRecentlyOpened> {
		return Promise.resolve({
			workspaces: [],
			files: []
		});
	}

	focusWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	closeWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	isMaximized(_windowId: number): Promise<boolean> {
		return Promise.resolve(false);
	}

	maximizeWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	minimizeWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	unmaximizeWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	onWindowTitleDoubleClick(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	setDocumentEdited(_windowId: number, _flag: boolean): Promise<void> {
		return Promise.resolve();
	}

	quit(): Promise<void> {
		return Promise.resolve();
	}

	relaunch(_options: { addArgs?: string[], removeArgs?: string[] }): Promise<void> {
		return Promise.resolve();
	}

	whenSharedProcessReady(): Promise<void> {
		return Promise.resolve();
	}

	toggleSharedProcess(): Promise<void> {
		return Promise.resolve();
	}

	// Global methods
	openWindow(_windowId: number, _uris: IURIToOpen[], _options?: { forceNewWindow?: boolean, forceReuseWindow?: boolean, forceOpenWorkspaceAsFile?: boolean }): Promise<void> {
		return Promise.resolve();
	}

	openNewWindow(): Promise<void> {
		return Promise.resolve();
	}

	showWindow(_windowId: number): Promise<void> {
		return Promise.resolve();
	}

	getWindows(): Promise<{ id: number; workspace?: IWorkspaceIdentifier; folderUri?: ISingleFolderWorkspaceIdentifier; title: string; filename?: string; }[]> {
		throw new Error('not implemented');
	}

	getWindowCount(): Promise<number> {
		return Promise.resolve(this.windowCount);
	}

	log(_severity: string, ..._messages: string[]): Promise<void> {
		return Promise.resolve();
	}

	showItemInFolder(_path: URI): Promise<void> {
		return Promise.resolve();
	}

	newWindowTab(): Promise<void> {
		return Promise.resolve();
	}

	showPreviousWindowTab(): Promise<void> {
		return Promise.resolve();
	}

	showNextWindowTab(): Promise<void> {
		return Promise.resolve();
	}

	moveWindowTabToNewWindow(): Promise<void> {
		return Promise.resolve();
	}

	mergeAllWindowTabs(): Promise<void> {
		return Promise.resolve();
	}

	toggleWindowTabsBar(): Promise<void> {
		return Promise.resolve();
	}

	updateTouchBar(_windowId: number, _items: ISerializableCommandAction[][]): Promise<void> {
		return Promise.resolve();
	}

	getActiveWindowId(): Promise<number | undefined> {
		return Promise.resolve(undefined);
	}

	// This needs to be handled from browser process to prevent
	// foreground ordering issues on Windows
	openExternal(_url: string): Promise<boolean> {
		return Promise.resolve(true);
	}

	// TODO: this is a bit backwards
	startCrashReporter(_config: Electron.CrashReporterStartOptions): Promise<void> {
		return Promise.resolve();
	}

	showMessageBox(_windowId: number, _options: Electron.MessageBoxOptions): Promise<IMessageBoxResult> {
		throw new Error('not implemented');
	}

	showSaveDialog(_windowId: number, _options: Electron.SaveDialogOptions): Promise<string> {
		throw new Error('not implemented');
	}

	showOpenDialog(_windowId: number, _options: Electron.OpenDialogOptions): Promise<string[]> {
		throw new Error('not implemented');
	}

	openAboutDialog(): Promise<void> {
		return Promise.resolve();
	}

	resolveProxy(windowId: number, url: string): Promise<string | undefined> {
		return Promise.resolve(undefined);
	}
}

export class TestTextResourceConfigurationService implements ITextResourceConfigurationService {

	_serviceBrand: any;

	constructor(private configurationService = new TestConfigurationService()) {
	}

	public onDidChangeConfiguration() {
		return { dispose() { } };
	}

	getValue<T>(resource: URI, arg2?: any, arg3?: any): T {
		const position: IPosition | null = EditorPosition.isIPosition(arg2) ? arg2 : null;
		const section: string | undefined = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
		return this.configurationService.getValue(section, { resource });
	}
}

export class TestTextResourcePropertiesService implements ITextResourcePropertiesService {

	_serviceBrand: any;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
	) {
	}

	getEOL(resource: URI): string {
		const filesConfiguration = this.configurationService.getValue<{ eol: string }>('files');
		if (filesConfiguration && filesConfiguration.eol) {
			if (filesConfiguration.eol !== 'auto') {
				return filesConfiguration.eol;
			}
		}
		return (isLinux || isMacintosh) ? '\n' : '\r\n';
	}
}


export class TestHashService implements IHashService {
	_serviceBrand: any;

	createSHA1(content: string): string {
		return content;
	}
}