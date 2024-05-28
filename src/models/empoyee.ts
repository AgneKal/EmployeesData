import { RowDataPacket } from "mysql2";

export interface Employee extends RowDataPacket{
        id?: number;
        name: string;
        surname: string;
        gender?: string;
        phone?: string;
        birthday?: Date;
        education?: string;
        salary?: string;
}