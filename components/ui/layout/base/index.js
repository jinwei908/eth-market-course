import { Navbar, Footer } from "@components/ui/common"
import {Web3Provider} from "@components/providers" //with this wrapper, you can then use this in ALL your pages

export default function BaseLayout({children}){ //children props
    return (
      <>
        <Web3Provider>
        <div className="max-w-7xl mx-auto px-4">
          <Navbar />
          <div className="fit">
            {children}
          </div>
        
      </div>
      <Footer />
    </Web3Provider>
    </>
    )
}