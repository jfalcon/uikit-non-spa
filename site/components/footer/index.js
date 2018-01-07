import React from 'react';

// props is always passed to stateless functional components, you can use destructuring
// assignment syntax in the parameter list to explode the values into direct variables
const Footer = () => {
   return (
      <footer className="components-footer">
        I'm a footer. You can render me statically.
      </footer>
   );
};

export default Footer;
