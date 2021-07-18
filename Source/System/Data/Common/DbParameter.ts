import { DataRowVersion } from 'System/Data/DataRowVersion';
import { DbType } from 'System/Data/DbType';
import { IDataParameter } from 'System/Data/IDataParameter';
import { IDbDataParameter } from 'System/Data/IDbDataParameter';
import { ParameterDirection } from 'System/Data/ParameterDirection';

export abstract class DbParameter implements IDbDataParameter, IDataParameter {
	public DbType: DbType; /* get; set; */

	public abstract ResetDbType(): void;

	public Direction: ParameterDirection; /* get; set; */

	private _IsNullable: boolean; /* get; set; */
	public get IsNullable(): boolean {
		return this._IsNullable;
	}
	public set IsNullable(value: boolean) {
		this._IsNullable = value;
	}

	public ParameterName: string; /* get; set; */

	public abstract get Precision();
	public abstract set Precision(value: number);

	public abstract get Scale();
	public abstract set Scale(value: number);

	public Size: number; /* get; set; */

	public SourceColumn: string; /* get; set; */

	public SourceColumnNullMapping: boolean; /* get; set; */

	public get SourceVersion() {
		return DataRowVersion.Default;
	}

	public set SourceVersion(value: DataRowVersion) {}

	public Value: any; /* get; set; */
}
