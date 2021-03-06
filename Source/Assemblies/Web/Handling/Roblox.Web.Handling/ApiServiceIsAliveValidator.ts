import { RequestHandler } from 'express-serve-static-core';
import { FileBaseUrls } from 'Assemblies/Common/Constants/Roblox.Common.Constants/FileBaseUrls';
import { KeyValueMapping } from 'Assemblies/Common/Mapping/Roblox.Common.Mapping/KeyValueMapping';
import { ICustomError } from 'Assemblies/Platform/ErrorModels/Roblox.Platform.ErrorModels/CustomError';
import { Security } from 'Assemblies/Web/Auth/Roblox.Web.Auth/Security';
import { ErrorsClient } from 'Assemblies/Web/Util/Roblox.Web.Util/ErrorsClient';
import { CommonValidator } from 'Assemblies/Web/Util/Roblox.Web.Util/Validators/CommonValidator';

export const ApiServiceIsAliveValidator = (async (request, response, next) => {
	const errorsClient = new ErrorsClient(response);
	const commonValidatorClient = new CommonValidator(response);
	if (await Security.GetUserFromCookie(request)) return next();
	if (await commonValidatorClient.IsFileStaticFile(FileBaseUrls[request.hostname], request.path)) return next();
	if (request.method === 'OPTIONS') return next();
	const cookie = KeyValueMapping.GetValueFromCookieString('RobloxSecurityToken', request.headers.cookie);
	if (
		!commonValidatorClient.ValidateDoesTheWorldGetToViewTheSite(
			request.method,
			encodeURIComponent(`${request.protocol}://${request.hostname}${request.url}`),
			cookie || <string>request.headers['roblox-security-token'],
			true,
		)
	) {
		const customErrors: ICustomError[] = [{ code: 0, message: 'Service Undergoing Maintenance' }];
		errorsClient.RespondWithCustomErrors(503, customErrors, true);
		return;
	}
	next();
}) as RequestHandler;
