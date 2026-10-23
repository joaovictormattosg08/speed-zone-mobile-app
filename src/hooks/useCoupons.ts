import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { CouponBenefit } from '../data/coupons';
export function useCoupons() {
 const { listCoupons }=useAuth();const [coupons,setCoupons]=useState<CouponBenefit[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useFocusEffect(useCallback(()=>{let alive=true,inFlight=false;const load=async()=>{if(inFlight)return;inFlight=true;try{const data=await listCoupons();if(alive){setCoupons(data);setError('');}}catch(e){if(alive){setCoupons([]);setError((e as Error).message);}}finally{inFlight=false;if(alive)setLoading(false);}};void load();const timer=setInterval(()=>void load(),15000);return()=>{alive=false;clearInterval(timer);};},[listCoupons]));
 return {coupons,error,loading};
}
