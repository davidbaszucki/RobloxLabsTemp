import { PartialDatabaseConditionType } from 'Assemblies/Mssql/Roblox.Mssql.PartialDatabase/Enumeration/PartialDatabaseConditionType';

export interface IPartialDatabaseCondition<TEntity, TKey extends keyof TEntity, TValue extends TEntity[TKey]> {
	Key: TKey;
	Condition: PartialDatabaseConditionType;
	Value: TValue;
}
