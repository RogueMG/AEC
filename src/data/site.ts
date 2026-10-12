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
};

export const locations: Location[] = [
  {
    id: "head-office",
    name: "Head Office",
    place: "Broadway, Chennai",
    address: "33 Sembudoss Street, Broadway, Chennai, Tamil Nadu 600001",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=33+Sembudoss+Street+Broadway+Chennai+600001",
  },
  {
    id: "factory",
    name: "Factory",
    place: "Sriperumbudur",
    address:
      "No. 297, Nehru Nagar, Chinna Vallarapuram, near Thandalam–Perambakkam–Thakkolam Road, Manur Village, Sriperumbudur, Tamil Nadu 602105",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Manur+Village+Sriperumbudur+Tamil+Nadu+602105",
  },
];

export type NavItem = { label: string; href: string };

// Only Home is built so far; the rest point at the matching home-page section.
export const navItems: NavItem[] = [
  { label: "Home", href: "#top" },
  { label: "Products", href: "#products" },
  { label: "About", href: "#about" },
  { label: "Industries", href: "#industries" },
  { label: "Brands", href: "#brands" },
  { label: "Catalogue", href: "#catalogue" },
  { label: "Contact", href: "#contact" },
];
