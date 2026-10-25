import { Navigate, useLocation } from 'react-router-dom';
import { knownPathFor } from '../seo/pages';

/**
 * Sends near-miss URLs to the real page: /BLOCKS, /blocks.html, /index.html,
 * //blocks (WEIRD-INPUT-9). nginx serves those with a 404 or with the wrong
 * page; here the browser replaces the URL so people see the page they meant.
 * Rendered once in each layout.
 */
const CanonicalRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const target = knownPathFor(pathname);
  return target ? <Navigate to={`${target}${search}${hash}`} replace /> : null;
};

export default CanonicalRedirect;
