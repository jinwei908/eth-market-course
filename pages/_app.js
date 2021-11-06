import { ToastContainer } from 'react-toastify';
import '@styles/globals.css'
import 'react-toastify/dist/ReactToastify.css';


const Noop = ({children}) => <>{children}</> //if no layout, assign Noop

function MyApp({ Component, pageProps }) {
  const Layout=Component.Layout ?? Noop
  return (
  <Layout>
    <ToastContainer/>
      <Component {...pageProps} />
    </Layout>
    )
}

export default MyApp
