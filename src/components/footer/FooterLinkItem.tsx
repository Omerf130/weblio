interface FooterLinkItemProps {
  text: string
  href: string
} 

const FooterLinkItem = ({text, href}:FooterLinkItemProps) => {
  
  return (
    <a
      href={href}
      className="link-wrapper"
    >
      <div className="text">{text}</div>
      <div
        className="underline"
      />
    </a>
  );
};

export default FooterLinkItem;
