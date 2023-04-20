export default function Tag ({sentiment}) {
    return (
        <>
        <span className={`tag ${sentiment}`}>&nbsp;{sentiment} </span>&nbsp;
        </>
      );
}