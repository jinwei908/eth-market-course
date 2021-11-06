
import { Loader } from "@components/ui/common";
import { toast } from "react-toastify";

export const withToast = (promise) => {
    toast.promise(
        promise,
          {
            pending: {
              render(){
                return (
                    <div className="flex items-center">
                        <Loader/>
                    
                        <div className="p-6 py-2">
                            <p className="mb-2">
                                Your transaction is being processed.
                            </p>
                            <p>
                                Hang tight... Just few more moments.
                            </p>
                        </div>
                    </div>
                )
              },
              icon: false,
            },
            success: {
              render({data}){
                return (

                    <div>
                        <p className="font-bold">Tx: {data.transactionHash}</p>
                        <p>
                            Has been successfully processed!
                        </p>
                        <a target="_blank" href={`https://ropsten.etherscan.io/tx/${data.transactionHash}`}>
                            <i className="text-indigo-600">See transaction details</i>
                        </a>
                    </div>

                )
              },
              // other options
              icon: "🟢",
            },
            error: {
              render({data}){
                // When the promise reject, data will contains the error
                return <div>{data.message ?? "Transaction has failed"}</div>
              }
            }
          },
          {closeButton: true, position: toast.POSITION.TOP_CENTER}
      )
}