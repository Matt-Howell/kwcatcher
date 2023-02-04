import {
  ChakraProvider,
  extendTheme
} from "@chakra-ui/react"
import { mode } from "@chakra-ui/theme-tools"
import '../styles/globals.css'

function KWCatcher({ Component, pageProps }) {
  return (
  <ChakraProvider theme={extendTheme({
    styles: {
      global: (props) => ({
        body: {
          bg: mode('#FFFFFF', 'rgb(25, 25, 25)')(props),
          fontFamily: "'Montserrat', sans-serif"
        },
        html: {
          colorScheme: mode('light', 'dark')(props)
        }
      }),
    },
  })}>
    <Component {...pageProps} />
  </ChakraProvider>
  );
}

export default KWCatcher
