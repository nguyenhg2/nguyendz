export default function Stars({n=5, size=14}) {
  return <span style={{color:'#c9973a',fontSize:size}}>{'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n))}</span>;
}