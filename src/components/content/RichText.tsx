import { PortableText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="type-body mt-4 first:mt-0">{children}</p>,
    h3: ({ children }) => <h3 className="type-subhead mt-8 first:mt-0">{children}</h3>,
  },
  list: {
    bullet: ({ children }) => <ul className="type-body mt-4 list-[square] space-y-1.5 pl-5">{children}</ul>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  },
};

function RichText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}

export default RichText;
