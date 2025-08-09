
export default function AnimatedBackground() {
    return (
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob"></div>
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
    )
}
