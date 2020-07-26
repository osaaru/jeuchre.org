const React = require("react")
const gatsby = jest.requireActual("gatsby")

module.exports = {
  ...gatsby,
  Link: jest.fn().mockImplementation(
    // these props are invalid for an `a` tag
    ({ _activeClassName, _activeStyle, _getProps, _innerRef, _ref, _replace, to, ...rest }) =>
      React.createElement("a", {
        ...rest,
        href: to,
      }),
  ),
  StaticQuery: jest.fn(),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}
