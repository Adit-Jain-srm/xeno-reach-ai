export default function GradientMesh() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Primary indigo blob */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/[0.07] blur-[120px] animate-float" />
      {/* Violet accent blob */}
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-purple-600/[0.05] blur-[100px] animate-float-slow" />
      {/* Cyan subtle accent */}
      <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[80px] animate-float" style={{ animationDelay: '-10s' }} />
    </div>
  )
}
