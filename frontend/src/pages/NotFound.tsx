import {Link} from "react-router-dom";

const NotFound = () => {
  return (
    <div className='flex flex-col justify-items-center items-center gap-30 mt-50'>
        <h1 className='font-bold p-1' >
            Bu sayfayı bulamadık
        </h1>

        <Link to="/" className='bg-black p-3 rounded-2xl  white text-gray-300 cursor-pointer'>
            Ana sayfaya dön
        </Link>
    </div>
  )
}

export default NotFound