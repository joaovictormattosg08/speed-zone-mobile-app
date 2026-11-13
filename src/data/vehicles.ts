import modelYears from './vehicleModelYears.json';

export type VehiclePreset = {
  id: string;
  brand: string;
  model: string;
  generation: string;
  years: string;
  engine: string;
  stockPower: string;
};

type VehicleRow = [model: string, generation: string, years: string, engine: string, stockPower: string];

const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const group = (brand: string, rows: VehicleRow[]): VehiclePreset[] => rows.map(([model, generation, years, engine, stockPower]) => ({
  id: slug(`${brand}-${model}-${generation}-${years}`), brand, model, generation, years, engine, stockPower,
}));

const detailedPresets: VehiclePreset[] = [
  ...group('BMW', [
    ['1M Coupé','E82','2011–2012','3.0 biturbo N54','340'],
    ['M2','F87','2016–2018','3.0 turbo N55','370'], ['M2 Competition','F87','2019–2021','3.0 biturbo S55','410'], ['M2 CS','F87','2020–2021','3.0 biturbo S55','450'],
    ['M2','G87','2023–2024','3.0 biturbo S58','460'], ['M2','G87 LCI','2025+','3.0 biturbo S58','480'],
    ['M3 3.0','E36','1992–1995','3.0 aspirado S50','286'], ['M3 3.2','E36','1995–1999','3.2 aspirado S50','321'],
    ['M3','E46','2000–2006','3.2 aspirado S54','343'], ['M3 CSL','E46','2003–2004','3.2 aspirado S54','360'],
    ['M3 Sedan','E90','2007–2011','4.0 V8 S65','420'], ['M3 Coupé','E92','2007–2013','4.0 V8 S65','420'], ['M3 GTS','E92','2010–2011','4.4 V8 S65','450'],
    ['M3','F80','2014–2018','3.0 biturbo S55','431'], ['M3 Competition','F80','2016–2018','3.0 biturbo S55','450'], ['M3 CS','F80','2018','3.0 biturbo S55','460'],
    ['M3','G80','2021+','3.0 biturbo S58','480'], ['M3 Competition','G80','2021+','3.0 biturbo S58','510'], ['M3 Competition xDrive','G80','2022+','3.0 biturbo S58','510'], ['M3 CS','G80','2023+','3.0 biturbo S58','550'],
    ['M4','F82','2014–2020','3.0 biturbo S55','431'], ['M4 Competition','F82','2016–2020','3.0 biturbo S55','450'], ['M4 CS','F82','2017–2020','3.0 biturbo S55','460'], ['M4 GTS','F82','2016','3.0 biturbo S55','500'],
    ['M4','G82','2021+','3.0 biturbo S58','480'], ['M4 Competition','G82','2021+','3.0 biturbo S58','510'], ['M4 Competition xDrive','G82','2022+','3.0 biturbo S58','510'], ['M4 CS','G82','2025+','3.0 biturbo S58','550'],
    ['M5','E34','1988–1992','3.6 aspirado S38','315'], ['M5','E34 3.8','1992–1995','3.8 aspirado S38','340'], ['M5','E39','1998–2003','4.9 V8 S62','400'],
    ['M5','E60','2005–2010','5.0 V10 S85','507'], ['M5','F10','2011–2016','4.4 V8 biturbo S63','560'], ['M5 Competition','F10','2014–2016','4.4 V8 biturbo S63','575'],
    ['M5','F90','2018–2020','4.4 V8 biturbo S63','600'], ['M5 Competition','F90','2019–2023','4.4 V8 biturbo S63','625'], ['M5 CS','F90','2021–2022','4.4 V8 biturbo S63','635'], ['M5 Hybrid','G90','2025+','4.4 V8 biturbo híbrido','727'],
    ['M6','E24','1983–1989','3.5 aspirado M88/S38','286'], ['M6','E63','2005–2010','5.0 V10 S85','507'], ['M6','F12/F13','2012–2018','4.4 V8 biturbo S63','560'],
    ['M8 Competition Coupé','F92','2020+','4.4 V8 biturbo S63','625'], ['M8 Competition Gran Coupé','F93','2020+','4.4 V8 biturbo S63','625'],
  ]),
  ...group('BMW', [
    ['X1 sDrive20i','E84','2010–2015','2.0 turbo N20','184'], ['X1 xDrive28i','E84','2011–2015','2.0 turbo N20','245'], ['X1 sDrive20i','F48','2016–2022','2.0 turbo B48','192'], ['X1 sDrive20i','U11','2023+','2.0 turbo B48','204'],
    ['X2 sDrive20i','F39','2018–2023','2.0 turbo B48','192'], ['X2 M35i','F39','2019–2023','2.0 turbo B48','306'], ['X2 M35i','U10','2024+','2.0 turbo B48','317'],
    ['X3 3.0si','E83','2006–2010','3.0 aspirado N52','272'], ['X3 xDrive28i','F25','2012–2017','2.0 turbo N20','245'], ['X3 xDrive35i','F25','2011–2017','3.0 turbo N55','306'], ['X3 xDrive30i','G01','2018+','2.0 turbo B48','252'], ['X3 M40i','G01','2018+','3.0 turbo B58','387'], ['X3 M Competition','F97','2020+','3.0 biturbo S58','510'],
    ['X4 xDrive28i','F26','2014–2018','2.0 turbo N20','245'], ['X4 xDrive35i','F26','2014–2018','3.0 turbo N55','306'], ['X4 M40i','G02','2019+','3.0 turbo B58','387'], ['X4 M Competition','F98','2020+','3.0 biturbo S58','510'],
    ['X5 4.8is','E53','2004–2006','4.8 V8 N62','360'], ['X5 xDrive35i','E70','2011–2013','3.0 turbo N55','306'], ['X5 M','E70','2010–2013','4.4 V8 biturbo S63','555'], ['X5 xDrive35i','F15','2014–2018','3.0 turbo N55','306'], ['X5 M','F85','2015–2018','4.4 V8 biturbo S63','575'], ['X5 xDrive40i','G05','2019+','3.0 turbo B58','340'], ['X5 M Competition','F95','2020+','4.4 V8 biturbo S63','625'],
    ['X6 xDrive35i','E71','2008–2014','3.0 biturbo N54/N55','306'], ['X6 M','E71','2010–2014','4.4 V8 biturbo S63','555'], ['X6 xDrive35i','F16','2015–2019','3.0 turbo N55','306'], ['X6 M','F86','2015–2019','4.4 V8 biturbo S63','575'], ['X6 xDrive40i','G06','2020+','3.0 turbo B58','340'], ['X6 M Competition','F96','2020+','4.4 V8 biturbo S63','625'],
    ['X7 xDrive40i','G07','2019+','3.0 turbo B58','340'], ['X7 M60i','G07 LCI','2023+','4.4 V8 biturbo S68','530'],
  ]),
  ...group('Volkswagen', [
    ['Fusca 1300','Typ 1','1967–1986','1.3 boxer','46'], ['Fusca 1600','Itamar','1993–1996','1.6 boxer','58'], ['SP2','Typ 149','1972–1976','1.7 boxer','75'],
    ['Gol GT','G1','1984–1986','1.8 AP','99'], ['Gol GTS','G1','1987–1994','1.8 AP','99'], ['Gol GTI','G1','1988–1994','2.0 AP injeção','120'], ['Gol GTI 16V','G2','1995–1999','2.0 16V','145'], ['Gol Turbo','G3','2000–2003','1.0 16V turbo','112'],
    ['Parati GLS','G1','1982–1995','1.8 AP','96'], ['Parati GTI 16V','G2','1997–1999','2.0 16V','145'], ['Parati Turbo','G3','2000–2003','1.0 16V turbo','112'],
    ['Saveiro Summer','G2','1996–1999','1.8 AP','99'], ['Saveiro Super Surf','G4','2006–2008','1.6 EA111','101'], ['Saveiro Cross','G5/G6','2010–2016','1.6 EA111/MSI','104'],
    ['Santana GLS','B2','1987–1991','2.0 AP','112'], ['Santana Exclusiv','B2','1997–1999','2.0 AP','114'], ['Quantum GLS','B2','1987–1995','2.0 AP','112'],
    ['Golf GTI','Mk3','1994–1998','2.0 8V','116'], ['Golf GTI','Mk4','1999–2005','1.8 turbo 20V','180'], ['Golf GTI','Mk5','2005–2009','2.0 TFSI EA113','200'], ['Golf GTI','Mk6','2010–2013','2.0 TSI EA888','211'], ['Golf GTI','Mk7','2014–2017','2.0 TSI EA888','220'], ['Golf GTI','Mk7.5','2018–2020','2.0 TSI EA888','230'], ['Golf GTI','Mk8','2021+','2.0 TSI EA888','245'], ['Golf R','Mk7','2014–2019','2.0 TSI EA888','300'], ['Golf R','Mk8','2021+','2.0 TSI EA888','320'],
    ['Jetta 2.5','A5','2007–2010','2.5 cinco cilindros','170'], ['Jetta TSI','A6','2011–2014','2.0 TSI EA888','200'], ['Jetta Highline','A6','2015–2018','2.0 TSI EA888','211'], ['Jetta GLI','A7','2019–2021','2.0 TSI EA888','230'], ['Jetta GLI','A7 facelift','2022+','2.0 TSI EA888','231'],
    ['Passat Turbo','B5','1998–2005','1.8 turbo 20V','150'], ['Passat 2.0 TSI','B6','2006–2010','2.0 TFSI EA113','200'], ['Passat CC','B6','2009–2012','3.6 VR6','300'], ['Passat R-Line','B8','2016–2020','2.0 TSI EA888','220'],
    ['Polo GTS','AW','2020–2022','1.4 TSI EA211','150'], ['Polo GTS','AW facelift','2023+','1.4 TSI EA211','150'], ['Virtus GTS','AW','2020+','1.4 TSI EA211','150'], ['Up! TSI','AA','2016–2021','1.0 TSI EA211','105'], ['Nivus GTS','A0','2025+','1.4 TSI EA211','150'],
  ]),
  ...group('Porsche', [
    ['911 Carrera','964','1989–1994','3.6 boxer aspirado','250'], ['911 Turbo','964','1991–1994','3.3/3.6 boxer turbo','320'],
    ['911 Carrera','993','1994–1998','3.6 boxer aspirado','272'], ['911 Turbo','993','1995–1998','3.6 boxer biturbo','408'],
    ['911 Carrera','996','1998–2004','3.4/3.6 boxer aspirado','300'], ['911 GT3','996','1999–2005','3.6 boxer aspirado','360'], ['911 Turbo','996','2001–2005','3.6 boxer biturbo','420'],
    ['911 Carrera S','997.1','2005–2008','3.8 boxer aspirado','355'], ['911 GT3','997.1','2006–2009','3.6 boxer aspirado','415'], ['911 Turbo','997.1','2007–2009','3.6 boxer biturbo','480'], ['911 Carrera S','997.2','2009–2012','3.8 boxer aspirado','385'], ['911 GT3 RS 4.0','997.2','2011','4.0 boxer aspirado','500'], ['911 Turbo S','997.2','2010–2013','3.8 boxer biturbo','530'],
    ['911 Carrera S','991.1','2012–2015','3.8 boxer aspirado','400'], ['911 GT3','991.1','2014–2016','3.8 boxer aspirado','475'], ['911 Turbo S','991.1','2014–2016','3.8 boxer biturbo','560'], ['911 Carrera S','991.2','2016–2019','3.0 boxer biturbo','420'], ['911 GT3','991.2','2018–2019','4.0 boxer aspirado','500'], ['911 GT2 RS','991.2','2018–2019','3.8 boxer biturbo','700'],
    ['911 Carrera','992.1','2020–2024','3.0 boxer biturbo','385'], ['911 Carrera S','992.1','2020–2024','3.0 boxer biturbo','450'], ['911 GT3','992.1','2022+','4.0 boxer aspirado','510'], ['911 Turbo S','992.1','2021+','3.8 boxer biturbo','650'], ['911 Dakar','992.1','2023+','3.0 boxer biturbo','480'], ['911 GT3 RS','992.1','2023+','4.0 boxer aspirado','525'], ['911 Carrera GTS T-Hybrid','992.2','2025+','3.6 boxer turbo híbrido','541'],
  ]),
  ...group('Honda', [
    ['Civic Si','EM1','1999–2000','1.6 VTEC B16A2','160'], ['Civic Si','EP3','2002–2005','2.0 i-VTEC K20A3','160'], ['Civic Si','FG2/FA5','2006–2011','2.0 i-VTEC K20Z3','197'], ['Civic Si','FB6','2012–2015','2.4 i-VTEC K24Z7','205'], ['Civic Si','FC1','2017–2021','1.5 turbo L15B7','208'], ['Civic Si','FE1','2022+','1.5 turbo L15CA','203'],
    ['Civic Type R','EK9','1997–2000','1.6 VTEC B16B','185'], ['Civic Type R','EP3','2001–2005','2.0 i-VTEC K20A','200'], ['Civic Type R','FN2','2007–2011','2.0 i-VTEC K20Z4','201'], ['Civic Type R','FK2','2015–2017','2.0 VTEC turbo K20C1','310'], ['Civic Type R','FK8','2017–2021','2.0 VTEC turbo K20C1','320'], ['Civic Type R','FL5','2023+','2.0 VTEC turbo K20C1','329'],
    ['Civic VTi','EG6','1992–1995','1.6 VTEC B16A','160'], ['Civic VTi','EK4','1996–2000','1.6 VTEC B16A','160'], ['Civic Touring','FC','2017–2021','1.5 turbo L15B7','173'],
    ['Integra Type R','DC2','1995–2001','1.8 VTEC B18C','200'], ['Integra Type R','DC5','2001–2006','2.0 i-VTEC K20A','220'], ['S2000','AP1','1999–2003','2.0 VTEC F20C','240'], ['S2000','AP2','2004–2009','2.2 VTEC F22C','237'], ['NSX','NA1','1990–1997','3.0 V6 VTEC C30A','274'], ['NSX','NA2','1997–2005','3.2 V6 VTEC C32B','294'],
  ]),
  ...group('Nissan', [
    ['Sentra SE-R Spec V','B15','2002–2006','2.5 QR25DE','175'], ['Sentra SE-R','B16','2007–2012','2.5 QR25DE','200'], ['Sentra','B17','2014–2019','2.0 MR20DE','140'], ['Sentra','B18','2020+','2.0 MR20DD','151'],
    ['350Z','Z33','2003–2006','3.5 V6 VQ35DE','280'], ['350Z HR','Z33','2007–2009','3.5 V6 VQ35HR','313'], ['370Z','Z34','2009–2020','3.7 V6 VQ37VHR','332'], ['Z','RZ34','2023+','3.0 V6 biturbo VR30DDTT','405'],
    ['Skyline GT-R','R32','1989–1994','2.6 biturbo RB26DETT','280'], ['Skyline GT-R','R33','1995–1998','2.6 biturbo RB26DETT','280'], ['Skyline GT-R','R34','1999–2002','2.6 biturbo RB26DETT','280'],
    ['GT-R','R35','2008–2011','3.8 V6 biturbo VR38DETT','485'], ['GT-R','R35 facelift','2012–2016','3.8 V6 biturbo VR38DETT','550'], ['GT-R Nismo','R35','2017+','3.8 V6 biturbo VR38DETT','600'], ['Silvia','S13','1988–1994','2.0 turbo SR20DET','205'], ['Silvia','S14','1993–1999','2.0 turbo SR20DET','220'], ['Silvia','S15','1999–2002','2.0 turbo SR20DET','250'],
  ]),
  ...group('Chevrolet', [
    ['Opala SS 4.1','Diplomata/Comodoro','1971–1992','4.1 seis cilindros','171'], ['Opala 250-S','SS','1976–1980','4.1 seis cilindros 250-S','171'], ['Caravan SS','A','1978–1982','4.1 seis cilindros','171'], ['Caravan Diplomata','A','1985–1992','4.1 seis cilindros','121'],
    ['Chevette GP','A','1976–1978','1.4','72'], ['Chevette S/R','A','1981–1982','1.6','80'], ['Chevette DL','A','1991–1993','1.6/S','78'],
    ['Monza S/R','J','1985–1989','2.0','110'], ['Kadett GSi','E','1989–1995','2.0 injeção','121'], ['Astra GSi','G','2003–2005','2.0 16V','136'], ['Vectra GSi','A','1993–1996','2.0 16V C20XE','150'],
    ['Corsa GSi','B','1995–1996','1.6 16V','108'], ['Celta','GM4200','2000–2015','1.0 VHC','78'], ['Omega CD','A','1993–1998','4.1 seis cilindros','168'],
    ['Camaro SS','5ª geração','2010–2015','6.2 V8 LS3','406'], ['Camaro SS','6ª geração','2016–2024','6.2 V8 LT1','461'], ['Camaro ZL1','6ª geração','2017–2024','6.2 V8 supercharged LT4','659'],
  ]),
  ...group('Audi', [
    ['A3 1.8T','8L','1999–2006','1.8 turbo 20V','180'], ['A3 2.0 TFSI','8P','2007–2013','2.0 TFSI EA113','200'], ['A3 2.0 TFSI','8V','2014–2020','2.0 TFSI EA888','220'], ['S3','8L','1999–2003','1.8 turbo 20V','225'], ['S3','8P','2007–2012','2.0 TFSI EA113','265'], ['S3','8V','2014–2020','2.0 TFSI EA888','300'], ['S3','8Y','2021+','2.0 TFSI EA888','310'],
    ['RS3','8V','2016–2020','2.5 TFSI cinco cilindros','400'], ['RS3','8Y','2022+','2.5 TFSI cinco cilindros','400'], ['TT RS','8J','2009–2014','2.5 TFSI cinco cilindros','340'], ['TT RS','8S','2017–2022','2.5 TFSI cinco cilindros','400'], ['RS6 Avant','C6','2008–2010','5.0 V10 biturbo','580'], ['RS6 Avant','C7','2013–2018','4.0 V8 biturbo','560'], ['RS6 Avant','C8','2020+','4.0 V8 biturbo','600'],
  ]),
  ...group('Mitsubishi', [
    ['Lancer Evolution III','CE9A','1995–1996','2.0 turbo 4G63','270'], ['Lancer Evolution IV','CN9A','1996–1998','2.0 turbo 4G63','280'], ['Lancer Evolution V','CP9A','1998–1999','2.0 turbo 4G63','280'], ['Lancer Evolution VI','CP9A','1999–2001','2.0 turbo 4G63','280'], ['Lancer Evolution VII','CT9A','2001–2003','2.0 turbo 4G63','280'], ['Lancer Evolution VIII','CT9A','2003–2005','2.0 turbo 4G63','280'], ['Lancer Evolution IX','CT9A','2005–2007','2.0 turbo 4G63','280'], ['Lancer Evolution X','CZ4A','2008–2016','2.0 turbo 4B11T','295'], ['Eclipse GS-T','2G','1995–1999','2.0 turbo 4G63','210'],
  ]),
  ...group('Subaru', [
    ['Impreza WRX','GC8','1993–2000','2.0 turbo EJ20','218'], ['Impreza WRX STI','GC8','1994–2000','2.0 turbo EJ20','280'], ['Impreza WRX','GD','2001–2007','2.0/2.5 turbo EJ','230'], ['Impreza WRX STI','GD','2001–2007','2.0/2.5 turbo EJ','280'], ['Impreza WRX STI','GR','2008–2014','2.5 turbo EJ257','305'], ['WRX','VA','2015–2021','2.0 turbo FA20','268'], ['WRX STI','VA','2015–2021','2.5 turbo EJ257','310'], ['WRX','VB','2022+','2.4 turbo FA24','271'],
  ]),
  ...group('Toyota', [
    ['Supra','A70','1986–1992','3.0 turbo 7M-GTE','235'], ['Supra Turbo','A80','1993–2002','3.0 biturbo 2JZ-GTE','280'], ['GR Supra 3.0','A90','2019+','3.0 turbo B58','340'], ['Corolla XRS','E140','2009–2012','2.0 3ZR-FE','153'], ['Corolla GR-S','E210','2021+','2.0 Dynamic Force','177'], ['GR Corolla','E210','2023+','1.6 turbo G16E-GTS','304'], ['GT86','ZN6','2012–2020','2.0 boxer FA20','200'], ['GR86','ZN8','2022+','2.4 boxer FA24','235'],
  ]),
  ...group('Ford', [
    ['Maverick GT','1ª geração','1974–1979','5.0 V8 302','197'], ['Escort XR3','Mk3/Mk4','1984–1992','1.6 CHT/AP','99'], ['Escort XR3 2.0i','Mk5','1993–1996','2.0 AP injeção','115'], ['Focus ST','Mk2','2005–2010','2.5 turbo cinco cilindros','225'], ['Focus RS','Mk2','2009–2011','2.5 turbo cinco cilindros','305'], ['Focus RS','Mk3','2016–2018','2.3 EcoBoost','350'], ['Fiesta ST','Mk7','2013–2019','1.6 EcoBoost','182'], ['Mustang GT','S197','2011–2014','5.0 V8 Coyote','412'], ['Mustang GT','S550','2015–2023','5.0 V8 Coyote','466'], ['Mustang GT','S650','2024+','5.0 V8 Coyote','488'],
  ]),
  ...group('Fiat', [
    ['Uno 1.5R','146','1987–1990','1.5 Sevel','86'], ['Uno 1.6R','146','1990–1993','1.6 Sevel','88'], ['Uno Turbo i.e.','146','1994–1996','1.4 turbo','118'], ['Tempra Turbo','159','1994–1999','2.0 turbo','165'], ['Marea Turbo','185','1999–2007','2.0 turbo cinco cilindros','182'], ['Bravo T-Jet','198','2011–2016','1.4 turbo T-Jet','152'], ['Punto T-Jet','199','2009–2014','1.4 turbo T-Jet','152'], ['500 Abarth','312','2014–2015','1.4 turbo MultiAir','167'],
  ]),
  ...group('Mercedes-AMG', [
    ['C 36 AMG','W202','1993–1997','3.6 seis cilindros','280'], ['C 43 AMG','W202','1997–2000','4.3 V8','306'], ['C 55 AMG','W203','2004–2007','5.4 V8','367'], ['C 63 AMG','W204','2008–2015','6.2 V8 M156','457'], ['C 63 S AMG','W205','2015–2021','4.0 V8 biturbo M177','510'], ['A 45 AMG','W176','2014–2018','2.0 turbo M133','381'], ['A 45 S AMG','W177','2020+','2.0 turbo M139','421'], ['E 55 AMG','W211','2003–2006','5.4 V8 supercharged','476'], ['E 63 S AMG','W213','2018–2023','4.0 V8 biturbo','612'],
  ]),
];

// NHTSA vPIC model-year records. These entries do not include trim specifications.
export const vehiclePresets = [
  ...detailedPresets,
  ...Object.entries(modelYears).flatMap(([brand, rows]) =>
    group(brand, rows.map(([model, year]) => [String(model), '', String(year), '', ''])),
  ),
];

const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
const searchIndex = vehiclePresets.map(vehicle => {
  const [start, end] = (vehicle.years.match(/\b\d{4}\b/g) ?? []).map(Number);
  return {
    vehicle,
    modelWords: normalized(`${vehicle.brand} ${vehicle.model}`).split(' '),
    text: normalized(`${vehicle.brand} ${vehicle.model} ${vehicle.generation} ${vehicle.years} ${vehicle.engine}`),
    start,
    end: end ?? (vehicle.years.endsWith('+') ? Infinity : start),
  };
});

export function searchVehiclePresets(query: string, limit = 8) {
  const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length || limit <= 0) return [];
  const matches = searchIndex.flatMap(({ vehicle, modelWords, text, start, end }) => {
    let score = 0;
    for (const term of terms) {
      if (/^(19|20)\d{2}$/.test(term)) {
        const year = Number(term);
        if (year < start || year > end || !start) return [];
      } else if (!text.includes(term)) return [];
      else if (modelWords.includes(term)) score++;
    }
    return [{ vehicle, score }];
  });
  return matches.sort((a, b) => b.score - a.score).slice(0, limit).map(match => match.vehicle);
}
