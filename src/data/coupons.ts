export type CouponBenefit={code:string;label:string;percent:number;freeShipping:boolean;usedOrder:string|null;fixedCents?:number;shippingPercent?:number;minimum?:number;unavailableReason?:string|null};
export type Promotion={code:string;label:string;kind:'percent'|'fixed'|'shipping';value:number;minimum:number;limit:number;expires:string;paused:boolean;archived:boolean;ownerEmail:string;revision:number;used:number;savings:number;state:'active'|'paused'|'expired'|'exhausted'|'archived'};
export type PromotionDraft=Omit<Promotion,'used'|'savings'|'state'>;
