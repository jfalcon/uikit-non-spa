import React from 'react';

// props is always passed to stateless functional components, you can use destructuring
// assignment syntax in the parameter list to explode the values into direct variables
const Layout = () => {
   return (
      <section className="components-layout">
        I'm a layout. You can render me statically.
      </section>
   );
};

export default Layout;
