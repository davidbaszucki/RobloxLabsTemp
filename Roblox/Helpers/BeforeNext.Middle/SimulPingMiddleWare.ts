/*
	FileName: init_middleware.ts
	Written By: Nikita Nikolaevich Petko
	File Type: Module
	Description: Global middleware that is executed before each request, changes to this will affect all servers

	All commits will be made on behalf of mfd-co to https://github.com/mfd-core/sitetest4.robloxlabs.com

	***

	Copyright 2015-2020 MFD

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

import { RequestHandler } from 'express-serve-static-core';
import { FASTLOG3, FLog } from '../WebHelpers/Roblox.Util/Roblox.Util.FastLog';

export const SimulPingMiddleware = ((req, res, next) => {
	FASTLOG3(FLog['SIMPLEPING'], `${req.method.toUpperCase()} REQUEST ON ${req.protocol}://${req.hostname}${req.url}`, false);
	if (!req.headers.cookie && req.hostname === 'rcity.simulpong.com' && req.path.toLocaleLowerCase() === '/') {
		return res.redirect('https://rcity.simulpong.com/Login/');
	}
	if (
		req.headers.cookie &&
		!req.headers.cookie.includes('TEAM-CITY-AUTH') &&
		req.hostname === 'rcity.simulpong.com' &&
		req.path.toLocaleLowerCase() === '/'
	) {
		return res.redirect('https://rcity.simulpong.com/Login?ReturnUrl=' + encodeURI(req.path));
	}
	if (
		req.headers.cookie &&
		req.headers.cookie.includes('TEAM-CITY-AUTH') &&
		req.hostname === 'rcity.simulpong.com' &&
		(req.path.toLowerCase() === '/login' || req.path.toLowerCase() === '/login/')
	) {
		return res.redirect('https://rcity.simulpong.com');
	}

	next();
}) as RequestHandler;