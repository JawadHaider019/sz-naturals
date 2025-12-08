const Title = ({ text1, text2 }) => {
  return (
    <div className="mb-8 flex flex-col items-center">
      <h1 className="uppercase text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black tracking-[-0.06em] text-center pb-3 md:pb-4 relative">
        {text1} <span className="text-gray-900">{text2}</span>
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 md:w-32 h-1  bg-gradient-to-r from-black  to-gray-900 rounded-2xl"></span>
      </h1>
    </div>
  )
}
export default Title