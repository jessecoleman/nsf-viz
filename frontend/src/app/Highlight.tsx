import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

type HighlightProps = {
  value: string
  query: string
}

const Highlight = (props: HighlightProps) => (
  <span>
    {parse(props.value, match(props.value, props.query)).map((part, idx) => (
      <span key={idx} style={{ fontWeight: part.highlight ? 700 : 400}}>
        {part.text}
      </span>
    ))}
  </span>
);

export default Highlight;