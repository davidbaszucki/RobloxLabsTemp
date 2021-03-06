import { IUsernameValidationRequest } from 'ApiSites/Roblox.Auth.Api/Models/UsernameValidationRequest';
import { IUser } from 'Assemblies/Platform/Membership/Roblox.Platform.Membership/IUser';

export interface IServiceUsernameValidationRequest {
	IUser: IUser;
	Request: IUsernameValidationRequest;
	IsSecure: System.Boolean;
}
