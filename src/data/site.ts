export const company = {
  name: "Asiatic Engineering Co.",
  shortName: "AEC",
  descriptor: "Manufacturing & Industrial Supply",
  established: 1999,
  msmeUdyam: "UDYAM-TN-02-0044701",
  gst: "33ADRPD5066H1ZI",
  region: "South India",
  // Catalogue PDF is pending from the client. Set a URL here to switch the banner to a download.
  catalogueUrl: null as string | null,
} as const;

export const contact = {
  mobile: { label: "+91 98400 47672", href: "tel:+919840047672" },
  landline: { label: "044-4200 9383", href: "tel:+914442009383" },
  email: { label: "asiaticaec@gmail.com", href: "mailto:asiaticaec@gmail.com" },
  whatsapp: { label: "WhatsApp", href: "https://wa.me/919840047672" },
} as const;

export type Location = {
  id: string;
  name: string;
  place: string;
  address: string;
  mapsHref: string;
  // What the embedded map searches for, when the full address is too detailed for Google to place.
  mapQuery?: string;
  // The same address split up for search engines (structured data).
  postal: { street: string; locality: string; region: string; postalCode: string };
};

export const locations: Location[] = [
  {
    id: "head-office",
    name: "Head Office",
    place: "Broadway, Chennai",
    address: "33 Sembudoss Street, Broadway, Chennai, Tamil Nadu 600001",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=33+Sembudoss+Street+Broadway+Chennai+600001",
    postal: { street: "33 Sembudoss Street, Broadway", locality: "Chennai", region: "Tamil Nadu", postalCode: "600001" },
  },
  {
    id: "factory",
    name: "Factory",
    place: "Sriperumbudur",
    address:
      "No. 297, Nehru Nagar, Chinna Vallarapuram, near Thandalam–Perambakkam–Thakkolam Road, Manur Village, Sriperumbudur, Tamil Nadu 602105",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Manur+Village+Sriperumbudur+Tamil+Nadu+602105",
    mapQuery: "Manur Village, Sriperumbudur, Tamil Nadu 602105",
    postal: {
      street: "No. 297, Nehru Nagar, Chinna Vallarapuram, near Thandalam–Perambakkam–Thakkolam Road, Manur Village",
      locality: "Sriperumbudur",
      region: "Tamil Nadu",
      postalCode: "602105",
    },
  },
];

// `to` is a router path. `section` is the home-page section that marks the item active while scrolling.
export type NavItem = { label: string; to: string; section: string };

export const navItems: NavItem[] = [
  { label: "Home", to: "/", section: "top" },
  { label: "Products", to: "/products", section: "products" },
  { label: "About", to: "/#about", section: "about" },
  { label: "Industries", to: "/#industries", section: "industries" },
  { label: "Brands", to: "/#brands", section: "brands" },
  { label: "Catalogue", to: "/#catalogue", section: "catalogue" },
  { label: "Contact", to: "/#contact", section: "contact" },
];
