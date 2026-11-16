// Product descriptions are stored as sanitised HTML limited to paragraphs, h3 headings,
// bullet lists, bold and italic. Sanitising happens where the HTML is saved, not here.
function RichText({ html }: { html: string }) {
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default RichText;
