import React from 'react';

// props is always passed to stateless functional components, you can use destructuring
// assignment syntax in the parameter list to explode the values into direct variables
const Header = () => {
   return (
      <header className="components-header">
        I'm a header. You can render me statically.
      </header>
   );
};

export default Header;
