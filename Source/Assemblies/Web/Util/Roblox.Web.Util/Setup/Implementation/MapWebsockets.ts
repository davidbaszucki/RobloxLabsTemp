/*
	FileName: MapWebsockets.ts
	Written By: Nikita Nikolaevich Petko
	File Type: Module
	Description: Looks in a folder for websockets

	All commits will be made on behalf of mfd-co to https://github.com/mfd-core/sitetest4.robloxlabs.com

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

import ws from 'ws';
import filestream from 'fs';
import { __baseDirName } from '../../../../../Common/Constants/Roblox.Common.Constants/Directories';
import { IncomingMessage, Server as httpserver } from 'http';
import { FASTLOG2, FASTLOG3, SFLog, SYNCHRONIZED_LOGGROUP } from '../../Logging/FastLog';
import { Server as httpsServer } from 'https';
import Urls from '../../../../../Common/Constants/Roblox.Common.Constants/Hosts';

interface wssOpts {
	path?: string;
	shouldHandleUpgrade?: boolean;
	apiName?: string;
	logSetups?: boolean;
}

SYNCHRONIZED_LOGGROUP(Urls['WebHost']);
SYNCHRONIZED_LOGGROUP(Urls['ApiProxyHost']);
SYNCHRONIZED_LOGGROUP(Urls['StaticCDN']);
SYNCHRONIZED_LOGGROUP(Urls['JavaScriptCDN']);
SYNCHRONIZED_LOGGROUP(Urls['CSSCDN']);
SYNCHRONIZED_LOGGROUP(Urls['ImagesCDN']);
SYNCHRONIZED_LOGGROUP(Urls['SetupCDN']);
SYNCHRONIZED_LOGGROUP(Urls['EphemeralCountersService']);
SYNCHRONIZED_LOGGROUP(Urls['TemporaryImagesCDN']);
SYNCHRONIZED_LOGGROUP(Urls['VersionCompatibilityService']);
SYNCHRONIZED_LOGGROUP(Urls['ClientSettingsService']);
SYNCHRONIZED_LOGGROUP(Urls['AssetGameHost']);
SYNCHRONIZED_LOGGROUP(Urls['EphemeralCountersV2']);
SYNCHRONIZED_LOGGROUP(Urls['GamePersistenceHost']);
SYNCHRONIZED_LOGGROUP(Urls['MarketplaceService']);
SYNCHRONIZED_LOGGROUP(Urls['MetricsHost']);
SYNCHRONIZED_LOGGROUP(Urls['AuthenticationHost']);
SYNCHRONIZED_LOGGROUP(Urls['ApiGatewayHost']);
SYNCHRONIZED_LOGGROUP(Urls['LocaleHost']);
SYNCHRONIZED_LOGGROUP(Urls['AbTestingHost']);
SYNCHRONIZED_LOGGROUP(Urls['AbTestingService']);
SYNCHRONIZED_LOGGROUP(Urls['UsersHost']);
SYNCHRONIZED_LOGGROUP(Urls['TSVHost']);
SYNCHRONIZED_LOGGROUP(Urls['LatencyMeasurementsInternalService']);
SYNCHRONIZED_LOGGROUP(Urls['ChatHost']);
SYNCHRONIZED_LOGGROUP(Urls['ContactsHost']);
SYNCHRONIZED_LOGGROUP(Urls['NotificationsHost']);
SYNCHRONIZED_LOGGROUP(Urls['AccountSettingsHost']);
SYNCHRONIZED_LOGGROUP(Urls['AdsHost']);
SYNCHRONIZED_LOGGROUP(Urls['TradesHost']);
SYNCHRONIZED_LOGGROUP(Urls['FriendsHost']);
SYNCHRONIZED_LOGGROUP(Urls['PrivateMessagesHost']);
SYNCHRONIZED_LOGGROUP(Urls['EconomyHost']);
SYNCHRONIZED_LOGGROUP(Urls['GamesHost']);
SYNCHRONIZED_LOGGROUP(Urls['RealTimeHost']);
SYNCHRONIZED_LOGGROUP(Urls['ThumbsHost']);
SYNCHRONIZED_LOGGROUP(Urls['PresenceHost']);
SYNCHRONIZED_LOGGROUP(Urls['GroupsHost']);
SYNCHRONIZED_LOGGROUP(Urls['AccountInformationHost']);
SYNCHRONIZED_LOGGROUP(Urls['BadgesHost']);
SYNCHRONIZED_LOGGROUP(Urls['DeveloperForumHost']);
SYNCHRONIZED_LOGGROUP(Urls['PremiumFeaturesHost']);
SYNCHRONIZED_LOGGROUP(Urls['ClientSettingsHost']);
SYNCHRONIZED_LOGGROUP(Urls['ClientSettingsCDNHost']);
SYNCHRONIZED_LOGGROUP(Urls['AdConfigurationHost']);
SYNCHRONIZED_LOGGROUP(Urls['ClientTelementryService']);
SYNCHRONIZED_LOGGROUP(Urls['AssetsHost']);
SYNCHRONIZED_LOGGROUP(Urls['AvatarHost']);
SYNCHRONIZED_LOGGROUP(Urls['BillingHost']);
SYNCHRONIZED_LOGGROUP(Urls['CatalogHost']);
SYNCHRONIZED_LOGGROUP(Urls['CdnProvidersHost']);
SYNCHRONIZED_LOGGROUP(Urls['ChatModerationHost']);
SYNCHRONIZED_LOGGROUP(Urls['ContentStoreHost']);
SYNCHRONIZED_LOGGROUP(Urls['DevelopHost']);
SYNCHRONIZED_LOGGROUP(Urls['DiscussionsHost']);
SYNCHRONIZED_LOGGROUP(Urls['EconomyCreatorStatsHost']);
SYNCHRONIZED_LOGGROUP(Urls['EngagementPayoutsHost']);
SYNCHRONIZED_LOGGROUP(Urls['FollowingsHost']);
SYNCHRONIZED_LOGGROUP(Urls['G18NHost']);
SYNCHRONIZED_LOGGROUP(Urls['GameJoinHost']);
SYNCHRONIZED_LOGGROUP(Urls['GroupsModerationHost']);
SYNCHRONIZED_LOGGROUP(Urls['InventoryHost']);
SYNCHRONIZED_LOGGROUP(Urls['ItemConfigurationHost']);
SYNCHRONIZED_LOGGROUP(Urls['LocalizationTablesHost']);
SYNCHRONIZED_LOGGROUP(Urls['PointsHost']);
SYNCHRONIZED_LOGGROUP(Urls['PublishHost']);
SYNCHRONIZED_LOGGROUP(Urls['PunishmentsService']);
SYNCHRONIZED_LOGGROUP(Urls['ShareHost']);
SYNCHRONIZED_LOGGROUP(Urls['TextFilterHost']);
SYNCHRONIZED_LOGGROUP(Urls['ThemesHost']);
SYNCHRONIZED_LOGGROUP(Urls['ThumbnailsResizerHost']);
SYNCHRONIZED_LOGGROUP(Urls['TranslationRolesHost']);
SYNCHRONIZED_LOGGROUP(Urls['TranslationsHost']);
SYNCHRONIZED_LOGGROUP(Urls['UserModerationHost']);
SYNCHRONIZED_LOGGROUP(Urls['VoiceHost']);
SYNCHRONIZED_LOGGROUP(Urls['FilesService']);
SYNCHRONIZED_LOGGROUP(Urls['MetricsInternalWebsite']);

export = (
	httpserver: { on: (arg0: string, arg1: (r: any, s: any, h: any) => any) => void },
	httpsServer?: { on: (arg0: string, arg1: (r: any, s: any, h: any) => any) => void },
	opts?: { path: filestream.PathLike; apiName: string; logSetups: any } | wssOpts,
): Promise<void> => {
	return new Promise<void>((resolve: (value?: PromiseLike<void> | void) => void, reject: (reason?: any) => void) => {
		let Sockets: string[];
		const maps: {
			dir: string;
			func: (request: ws, Response: IncomingMessage) => unknown;
		}[] = [];
		try {
			Sockets = filestream.readdirSync((opts !== undefined ? opts.path : __baseDirName + '/sockets') || __baseDirName + '/sockets');
		} catch (err) {
			return FASTLOG2(SFLog[opts.apiName], '[SFLog::%s] %s', opts.apiName, err.message);
		}
		FASTLOG3(SFLog[opts.apiName], `[SFLog::%s] https://%s has %d websocket(s)`, opts.apiName, opts.apiName, Sockets.length);
		Sockets.forEach((v) => {
			if (!v.includes('.js.map') || !v.includes('.d.ts')) {
				let map: {
					default: { dir: string; func: (request: ws, Response: IncomingMessage) => unknown };
				};

				try {
					map = require(((opts !== undefined ? opts.path + '/' : __baseDirName + '/sockets/') || __baseDirName + '/sockets/') +
						v);
				} catch (err) {
					return console.error(err);
				}

				if (map.default) {
					if (!map.default.dir) return;
					if (!map.default.func) return;
					FASTLOG3(SFLog[opts.apiName], `[SFLog::%s] MAPPING WEBSOCKET wss://%s%s`, opts.apiName, opts.apiName, map.default.dir);
					maps.push(map.default);
				} else {
					return reject(`${v} had no default export.`);
				}
			}
		});
		if (httpsServer) {
			const wssServer = new ws.Server({ server: <httpsServer>httpsServer, port: 8000, host: opts.apiName });
			if (opts.logSetups) FASTLOG2(SFLog[opts.apiName], `[SFLog::%s] MAPPING UPGRADE https://%s:8000`, opts.apiName, opts.apiName);
			httpsServer.on('upgrade', (r, s, h) => {
				let isValid = false;
				maps.forEach((v) => {
					if (r.url.split('?').shift() === v.dir) {
						wssServer.handleUpgrade(r, s, h, (s2) => {
							wssServer.emit('connection', s2, r);
						});
						isValid = true;
					}
				});
				if (!isValid) {
					s.write('https/3.0 404 Socket Not Found\r\n\r\n');
					return s.destroy();
				}
			});
			if (opts.logSetups) FASTLOG2(SFLog[opts.apiName], `[SFLog::%s] MAPPING CONNECT https://%s:8000`, opts.apiName, opts.apiName);
			wssServer.on('connection', (s, r) => {
				maps.forEach((v) => {
					if (r.url.split('?').shift() === v.dir) {
						return v.func(s, r);
					}
				});
			});
		}
		const wsServer = new ws.Server({ server: <httpserver>httpserver, port: 5000, host: opts.apiName });
		if (opts.logSetups) FASTLOG2(SFLog[opts.apiName], `[SFLog::%s] MAPPING UPGRADE http://%s:5000`, opts.apiName, opts.apiName);
		httpserver.on('upgrade', (r, s, h) => {
			let isValid = false;
			maps.forEach((v) => {
				if (r.url.split('?').shift() === v.dir) {
					wsServer.handleUpgrade(r, s, h, (s2) => {
						wsServer.emit('connection', s2, r);
					});
					isValid = true;
				}
			});
			if (!isValid) {
				s.write('https/3.0 404 Socket Not Found\r\n\r\n');
				return s.destroy();
			}
		});
		if (opts.logSetups) FASTLOG2(SFLog[opts.apiName], `[SFLog::%s] MAPPING CONNECT http://%s:5000`, opts.apiName, opts.apiName);
		wsServer.on('connection', (s, r) => {
			maps.forEach((v) => {
				if (r.url.split('?').shift() === v.dir) {
					return v.func(s, r);
				}
			});
		});
		resolve();
	});
};
