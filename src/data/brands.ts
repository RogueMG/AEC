// Logo files are pending from the client; brands render as wordmarks until supplied.
export type Brand = { id: string; name: string; logo?: string };

export const brands: Brand[] = [
  { id: "stanley", name: "Stanley" },
  { id: "kobe", name: "Kobe" },
  { id: "cp-grat-ex", name: "CP Grat-Ex" },
  { id: "bestarc", name: "Bestarc" },
  { id: "calguard", name: "Calguard" },
  { id: "karam", name: "Karam" },
  { id: "bosch", name: "Bosch" },
  { id: "wesaf", name: "Wesaf" },
  { id: "addison", name: "Addison" },
  { id: "totem", name: "Totem" },
];
