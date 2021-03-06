/*
	FileName: startup.ts
	Written By: Nikita Nikolaevich Petko
	File Type: Module
	Description: A mock of ASP.NET and Servers.FX

	All commits will be made on behalf of mfd-co to https://github.com/mfdlabs/robloxlabs.com

	***

	Copyright 2006-2021 ROBLOX

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	https://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.

	***
*/

import { Express as IApplicationBuilder, Request, Response } from 'express-serve-static-core';
import { json as jparser, Router, static as Pages } from 'express';
import ServeIndex from 'serve-index';
import bparser from 'body-parser';
import cparser from 'cookie-parser';
import { Server as BaselineServer, IncomingMessage } from 'http';
import Ssl, { Server as BaselineSslServer } from 'https';
import SslV2 from 'spdy';
import { readFileSync, existsSync as FileOrDirectoryExists } from 'fs';
import Socket, { Server as WebsocketServer } from 'ws';
import { Socket as DuplexSocket } from 'net';
import {
	DFFlag,
	DFLog,
	DYNAMIC_LOGGROUP,
	FASTLOG2,
	FASTLOG3,
	FASTLOGS,
	FLog,
	SFLog,
} from 'Assemblies/Web/Util/Roblox.Web.Util/Logging/FastLog';
import { __baseDirName, __sslDirName } from 'Assemblies/Common/Constants/Roblox.Common.Constants/Directories';
import { IWebsocketOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IWebsocketOptions';
import { IConfigOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IConfigOptions';
import { FastLogGlobal } from 'Assemblies/Web/Util/Roblox.Web.Util/Logging/FastLogGlobal';
import { IControllerOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IControllerOptions';
import { Walkers } from 'Assemblies/Web/Util/Roblox.Web.Util/Walkers';
import { IControllerOptionsV2 } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IControllerOptionsV2';
import { WebControllerParsers } from 'Assemblies/Web/Parsers/Roblox.Web.Parsers/WebControllerParsers';
import { IPageDirectoryOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IPageDirectoryOptions';
import { IPageOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IPageOptions';
import { IRoutingOptions } from 'Assemblies/Web/Util/Roblox.Web.Util/Setup/Interfaces/IRoutingOptions';
import { IWebsocketRoute } from '../Interfaces/IWebsocketRoute';

FastLogGlobal.IncludeHostLogLevels();

DYNAMIC_LOGGROUP('Tasks');
export class SystemSDK {
	public static async Configure(opts: IConfigOptions): Promise<void> {
		try {
			opts.app.disable('etag');
			opts.app.disable('case sensitive routing');
			opts.app.enable('trust proxy');
			opts.app.disable('x-powered-by');
			opts.app.disable('strict routing');
			opts.app.use(cparser());
			if (!opts.doNotUseJSON) opts.app.use(jparser({ strict: false }));
			if (!opts.doNotUseUrlEncoded) opts.app.use(bparser.urlencoded({ extended: false }));
			if (opts.UsePages) {
				SystemSDK.UseStaticPageRouting(opts.app, opts.PagesOpts, opts.PageOpts);
			}
			if (opts.fileListings) {
				SystemSDK.UseStaticFileListing(opts.app, opts.PagesOpts);
			}
			if (opts.UseRouting) {
				SystemSDK.UseExpressRouter(opts.app, opts.RoutingOpts);
			}
			if (opts.UseEndpoints) {
				if (opts.useBetaControllerMapping) {
					await SystemSDK.MapControllersInternalV2(opts.app, opts.EndpointOpts);
				} else {
					await SystemSDK.MapControllersInternal(opts.app, opts.EndpointOpts);
				}
			}
			if (opts.errorpage) {
				SystemSDK.DefaultExceptionPage(opts.app);
			}
		} catch (e) {
			FASTLOG2(DFLog('Tasks'), `[DFLog::Tasks] Message: %s, Stack: %s`, e.message, e.stack);
		}
	}

	public static MetadataBuilder(
		app: IApplicationBuilder,
		PagesDir: string,
		EndpointsDir: string,
		apiName: string,
		errorpage?: boolean,
		fileListings?: boolean,
		useNewControllers?: boolean,
		doNotParseJSON?: boolean,
		doNotParseFORM?: boolean,
		doNotUseEndpoints?: boolean,
	) {
		return {
			app: app,
			UsePages: true,
			PageOpts: {
				etag: false,
				redirect: true,
				lastModified: false,
				setHeaders: (response: Response): void => {
					response.set('x-powered-by', 'ASP.NET');
					response.set('server', 'Amazon S3');
				},
			},
			UseRouting: true,
			PagesOpts: {
				path: __baseDirName + PagesDir,
			},
			EndpointOpts: {
				path: __baseDirName + EndpointsDir,
				logSetups: true,
				apiName: apiName,
			},
			errorpage: errorpage,
			fileListings,
			useBetaControllerMapping: useNewControllers,
			doNotUseUrlEncoded: doNotParseFORM,
			doNotUseJSON: doNotParseJSON,
			UseEndpoints: !doNotUseEndpoints,
		} as unknown as IConfigOptions;
	}

	public static ServerStarter(
		app: IApplicationBuilder,
		name: string,
		useHttps: bool = true,
		useHttp: bool = true,
		httpPort: int = 80,
		httpsPort: int = 443,
	): [BaselineServer, BaselineSslServer] {
		try {
			let baselineSslServer: BaselineSslServer;
			let baseLineServer: BaselineServer;
			if (useHttps)
				baselineSslServer = (DFFlag('GlobalHTTP2Enabled') ? SslV2 : Ssl)
					.createServer(
						{
							cert: readFileSync(__sslDirName + '/ST4.crt', 'utf-8'),
							key: readFileSync(__sslDirName + '/ST4.key', 'utf-8'),
							ca: [readFileSync(__sslDirName + '/rootCA.crt', 'utf-8')],
							passphrase: process.env['ST4_pw'],
						},
						app,
					)
					.listen(httpsPort, name, () => FASTLOG3(SFLog[name], `[SFLog::%s] https://%s:%d Started`, name, name, httpsPort));
			if (useHttp)
				baseLineServer = app.listen(httpPort, name, () =>
					FASTLOG3(SFLog[name], `[SFLog::%s] http://%s:%d Started`, name, name, httpPort),
				);
			return [baseLineServer, baselineSslServer];
		} catch (err) {
			throw new Error(err);
		}
	}

	public static async WebsocketStarter(
		baselineServer: BaselineServer,
		baselineSslServer: BaselineSslServer,
		dir: string,
		apiName: string,
	) {
		await SystemSDK.MapWebsocketServers(baselineServer, baselineSslServer, {
			path: __baseDirName + dir,
			shouldHandleUpgrade: true,
			apiName: apiName,
			logSetups: true,
		});
	}

	private static async MapWebsocketServers(
		baselineServer: BaselineServer,
		baselineSslServer?: BaselineSslServer,
		options?: IWebsocketOptions,
	): Promise<void> {
		return new Promise<void>((resumeFunction, errorFunction) => {
			const rootDirectory = (options !== undefined ? options.path : __baseDirName + '/sockets') || __baseDirName + '/sockets';
			const webSocketRoutes = SystemSDK.ExtractWebsocketRoutes(rootDirectory, options);
			if (webSocketRoutes === null) return;

			FASTLOG3(
				SFLog[options.apiName],
				`[SFLog::%s] https://%s has %d websocket(s)`,
				options.apiName,
				options.apiName,
				webSocketRoutes.length,
			);
			const clientRouteMaps = SystemSDK.ExtractWebsocketClientRouteMaps(rootDirectory, webSocketRoutes, options, errorFunction);

			if (baselineSslServer) {
				const baselineSslWebsocketServer = new WebsocketServer({ server: baselineSslServer, port: 8000, host: options.apiName });
				if (options.logSetups)
					FASTLOG2(SFLog[options.apiName], `[SFLog::%s] MAPPING UPGRADE https://%s:8000`, options.apiName, options.apiName);
				baselineSslServer.on('upgrade', (incomingMessage: IncomingMessage, duplexSocket: DuplexSocket, upgradeHeader: Buffer) => {
					SystemSDK.HandleServerUpgrade(
						clientRouteMaps,
						incomingMessage,
						baselineSslWebsocketServer,
						duplexSocket,
						upgradeHeader,
					);
				});
				if (options.logSetups)
					FASTLOG2(SFLog[options.apiName], `[SFLog::%s] MAPPING CONNECT https://%s:8000`, options.apiName, options.apiName);
				baselineSslWebsocketServer.on('connection', (client: Socket, incomingClientRequest) => {
					SystemSDK.GetWebsocketRouteAndInvokeCallback(clientRouteMaps, incomingClientRequest, client);
				});
			}
			const baselineWebsocketServer = new WebsocketServer({ server: baselineServer, port: 5000, host: options.apiName });
			if (options.logSetups)
				FASTLOG2(SFLog[options.apiName], `[SFLog::%s] MAPPING UPGRADE http://%s:5000`, options.apiName, options.apiName);
			baselineServer.on('upgrade', (incomingMessage: IncomingMessage, duplexSocket: DuplexSocket, upgradeHeader: Buffer) => {
				SystemSDK.HandleServerUpgrade(clientRouteMaps, incomingMessage, baselineWebsocketServer, duplexSocket, upgradeHeader);
			});
			if (options.logSetups)
				FASTLOG2(SFLog[options.apiName], `[SFLog::%s] MAPPING CONNECT http://%s:5000`, options.apiName, options.apiName);
			baselineWebsocketServer.on('connection', (client: Socket, incomingClientRequest: IncomingMessage) => {
				SystemSDK.GetWebsocketRouteAndInvokeCallback(clientRouteMaps, incomingClientRequest, client);
			});
			resumeFunction();
		});
	}

	private static HandleServerUpgrade(
		clientRouteMaps: IWebsocketRoute[],
		incomingMessage: IncomingMessage,
		baselineWebsocketServer: Socket.Server,
		duplexSocket: DuplexSocket,
		upgradeHeader: Buffer,
	) {
		let isValid = false;
		clientRouteMaps.forEach((clientRouteMap) => {
			isValid = SystemSDK.CheckDoesWebsocketRouteExistAndDispatchConnection(
				incomingMessage,
				clientRouteMap,
				baselineWebsocketServer,
				duplexSocket,
				upgradeHeader,
			);
		});
		if (!isValid) {
			duplexSocket.write('HTTP/1.1 404 Socket Not Found\r\n\r\n');
			duplexSocket.destroy();
		}
	}

	private static GetWebsocketRouteAndInvokeCallback(
		clientRouteMaps: IWebsocketRoute[],
		incomingClientRequest: IncomingMessage,
		client: Socket,
	) {
		clientRouteMaps.forEach((clientRouteMap) => {
			if (incomingClientRequest.url.split('?').shift() === clientRouteMap.Route) {
				return clientRouteMap.Callback(client, incomingClientRequest);
			}
		});
	}

	private static ExtractWebsocketRoutes(dirname: string, options: IWebsocketOptions): string[] {
		try {
			return Walkers.WalkDirectory(dirname);
		} catch (ex) {
			FASTLOG2(SFLog[options.apiName], '[SFLog::%s] %s', options.apiName, ex.message);
			return null;
		}
	}

	private static ExtractWebsocketClientRouteMaps(
		rootDirectory: string,
		webSocketRoutes: string[],
		options: IWebsocketOptions,
		errorFunction: (reason?: any) => void,
	) {
		const clientRouteMaps: IWebsocketRoute[] = [];
		webSocketRoutes.forEach((route) => {
			let name = route.split('\\').join('/');
			name = name.replace(rootDirectory, '');
			if (name.match(/.+\.js/)) {
				name = name.replace('.js', '');
				name = name.split('_P-').join(':');
				name = name.split('\\').join('/');
				if (name === '/__pageIndex') name = '/';
				let clientMap: {
					default: IWebsocketRoute;
				};

				try {
					clientMap = require(rootDirectory + name);
				} catch (err) {
					return console.error(err);
				}

				if (clientMap.default) {
					if (!clientMap.default.Callback) return;
					clientMap.default.Route = name;
					FASTLOG3(SFLog[options.apiName], `[SFLog::%s] MAPPING WEBSOCKET wss://%s%s`, options.apiName, options.apiName, name);
					clientRouteMaps.push(clientMap.default);
				} else {
					return errorFunction(`${name} had no default export.`);
				}
			}
		});
		return clientRouteMaps;
	}

	private static CheckDoesWebsocketRouteExistAndDispatchConnection(
		incomingMessage: IncomingMessage,
		clientRouteMap: IWebsocketRoute,
		baselineSslWebsocketServer: Socket.Server,
		duplexSocket: DuplexSocket,
		upgradeHeader: Buffer,
	) {
		let isValid = false;
		if (incomingMessage.url.split('?').shift() === clientRouteMap.Route) {
			baselineSslWebsocketServer.handleUpgrade(
				incomingMessage,
				duplexSocket,
				upgradeHeader,
				(client: Socket, incomingClientMessage: IncomingMessage) => {
					baselineSslWebsocketServer.emit('connection', client, incomingClientMessage);
				},
			);
			isValid = true;
		}
		return isValid;
	}

	private static DefaultExceptionPage(app: IApplicationBuilder): void {
		app.all('/Error.ashx', (request, response) => {
			response.status(request.query.code !== undefined ? parseInt(request.query.code as string) || 400 : 400);
			const msg = request.query.message;
			response.send({
				Error: parseInt(request.query.code as string) || response.statusCode,
				Message: `${msg || (response.statusCode === 400 ? 'BadRequest' : response.statusCode === 404 ? 'NotFound' : '')}`,
				Redirect: request.query.redirect
					? `Redirect from: ${
							(request.query.redirect as string).split(';')[0].startsWith('https')
								? (request.query.redirect as string).split(';')[0]
								: 'unknownuri'
					  } to ${
							((request.query.redirect as string).split(';')[1]
								? (request.query.redirect as string).split(';')[1].startsWith('https')
									? (request.query.redirect as string).split(';')[1]
									: 'unknownuri'
								: 'unknownuri') || 'unknownuri'
					  }`
					: undefined,
			});
		});
	}

	private static async MapControllersInternal(app?: IApplicationBuilder, opts?: IControllerOptions): Promise<void> {
		return new Promise(async (resumeFunction) => {
			const directory = (opts !== undefined ? opts.path : __baseDirName + '/Controllers') || __baseDirName + '/Controllers';
			if (!FileOrDirectoryExists(directory)) {
				FASTLOG2(
					DFLog('Tasks'),
					`[DFLog::Tasks] The directory %s for the api %s was not found, make sure you configured your directory correctly.`,
					directory,
					opts.apiName,
				);
				return resumeFunction();
			}
			const files = Walkers.WalkDirectory(directory);
			let count = 0;
			files.forEach((v) => {
				let name = v.split('\\').join('/');
				name = name.replace(directory, '');
				if (name.match(/.+\.js/)) {
					name = name.replace('.js', '');
					name = name.split('_P-').join(':');
					name = name.split('\\').join('/');
					if (name === '/__pageIndex') name = '/';
					let map: {
						default: { func: (request: Request, Response: Response) => unknown; method: string };
					};

					try {
						map = require(v);
					} catch (err) {
						return FASTLOG2(SFLog[opts.apiName], '[SFLog::%s] %s', opts.apiName, err.stack);
					}
					let func: (request: Request, Response: Response) => unknown;
					let method: string;
					if (map.default) {
						if (map.default.func) func = map.default.func;
						else return;
						if (map.default.method) method = map.default.method.toLowerCase();
						else return;
						count++;
						try {
							if (method === 'get') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping GET %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.get(name, func);
							} else if (method === 'head') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping HEAD %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.head(name, func);
							} else if (method === 'post') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping POST %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.post(name, func);
							} else if (method === 'put') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping PUT %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.put(name, func);
							} else if (method === 'delete') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping DELETE %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.delete(name, func);
							} else if (method === 'connect') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping CONNECT %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.connect(name, func);
							} else if (method === 'options') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping OPTIONS %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.options(name, func);
							} else if (method === 'trace') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping TRACE %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.trace(name, func);
							} else if (method === 'patch') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping PATCH %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.patch(name, func);
							} else if (method === 'all') {
								if (opts.logSetups)
									FASTLOG2(
										SFLog[opts.apiName],
										`[SFLog::%s] Mapping ALL %s`,
										opts.apiName,
										(opts.apiName ? 'https://' + opts.apiName : '') + name,
									);
								app.all(name, func);
							} else {
								return FASTLOGS(SFLog[opts.apiName], '[SFLog::%s] Error requesting Controller.', opts.apiName);
							}
						} catch (err) {
							return FASTLOG2(SFLog[opts.apiName], '[SFLog::%s] %s', opts.apiName, err.stack);
						}
					} else {
						return FASTLOG2(SFLog[opts.apiName], '[SFLog::%s] This Controller had no default export. %s', opts.apiName, v);
					}
				}
			});
			FASTLOG3(SFLog[opts.apiName], `[SFLog::%s] https://%s has %d controller(s)`, opts.apiName, opts.apiName, count);
			resumeFunction();
		});
	}

	private static async MapControllersInternalV2(app?: IApplicationBuilder, opts?: IControllerOptionsV2): Promise<void> {
		return new Promise(async (resumeFunction) => {
			const directory = (opts !== undefined ? opts.path : __baseDirName + '\\Controllers') || __baseDirName + '\\Controllers';
			if (!FileOrDirectoryExists(directory)) {
				FASTLOG2(
					DFLog('Tasks'),
					`[DFLog::Tasks] The directory %s for the api %s was not found, make sure you configured your directory correctly.`,
					directory,
					opts.apiName,
				);
				return resumeFunction();
			}
			const r = Walkers.WalkDirectory(directory);
			r.forEach((dir) => {
				if (dir.match(/.+\.js/)) {
					try {
						const data = require(dir);
						const controller = Walkers.WalkClassMap(data);
						if (controller) {
							WebControllerParsers.ControllerMethodParser(app, controller, opts.apiName);
						}
					} catch (e) {
						throw new Error('Error while parsing the given controller: ' + e.message + e.stack);
					}
				}
			});
			resumeFunction();
		});
	}

	private static UseStaticPageRouting(app: IApplicationBuilder, opts: IPageDirectoryOptions, PagesOpts: IPageOptions) {
		const path = (opts !== undefined ? opts.path : __baseDirName + '/StaticPages') || __baseDirName + '/StaticPages';
		if (!FileOrDirectoryExists(path)) {
			FASTLOGS(
				FLog['Pages'],
				`[FLog::Pages] The directory %s was not found, make sure you configured your directory correctly. Static pages, so this will that return ctx::resumeFunc()`,
				path,
			);
		}
		app.use(Pages(path, PagesOpts));
	}
	private static UseStaticFileListing(app: IApplicationBuilder, opts: IPageDirectoryOptions): void {
		const path = (opts !== undefined ? opts.path : __baseDirName + '/StaticPages') || __baseDirName + '/StaticPages';
		if (!FileOrDirectoryExists(path)) {
			FASTLOGS(
				FLog['Pages'],
				`[FLog::Pages] The directory %s was not found, make sure you configured your listing directory correctly. Static pages, so this will that return ctx::resumeFunc()`,
				path,
			);
			console.error(
				'The directory %s was not found, make sure you configured your listing directory correctly. Static pages, so this will that return ctx::resumeFunc()',
			);
		}
		app.use('/', ServeIndex(path + '/listings', { icons: true }));
	}

	private static UseExpressRouter(app: IApplicationBuilder, opts?: IRoutingOptions): void {
		app.use(Router(opts));
	}
}
