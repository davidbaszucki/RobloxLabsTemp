import { IPort } from 'Microsoft/Ccr/Core/IPort';

export interface IPortElement {
	Owner: IPort;

	Next: IPortElement;

	Previous: IPortElement;

	CausalityContext: object;

	readonly Item: object;
}

export interface IPortElementGeneric<T> extends IPortElement {
	readonly TypedItem: T;
}
