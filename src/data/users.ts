export type UserRole = 'customer' | 'technician' | 'admin';
export const roleLabels: Record<UserRole,string> = { customer:'Cliente / Piloto',technician:'Equipe técnica',admin:'Administrador' };
export type ManagedUser = { vip?:boolean; id:string;name:string;surname:string;email:string;phone:string;photo:string|null;vehicle:string;address:string;role:UserRole;blocked:boolean;archived:boolean;reason:string;revision:number;createdAt:string|null;orders:number;spent:number;replies:number };
export type UserDraft = Pick<ManagedUser,'vip'|'name'|'surname'|'email'|'phone'|'role'|'blocked'|'archived'|'reason'|'revision'> & {password?:string};
export type UserLog = {action:string;createdAt:string;actorId:string};
