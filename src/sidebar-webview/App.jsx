/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Tag from './Tag';

const vscode = acquireVsCodeApi();

const StyledBox = styled.div`
  padding: 10px;
  .search-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    input {
      flex: 1;
      margin-right: 10px;
    }
  }
`;

const App = (props) => {
  const [tags, setTags] = useState(props.tags);
  const [input, setInput] = useState('');

  useEffect(() => {
    // 根据 tag 的数量排序
    tags.sort((a, b) => b[1] - a[1]);
    setTags([...tags]);
  }, [props.tags]);

  return (
    <StyledBox>
      <div className="search-row">
        <input
          value={input}
          placeholder="Enter a tag"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              vscode.postMessage({
                type: 'tag',
                tag: input,
              });
            }
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            vscode.postMessage({
              type: 'tag',
              tag: input,
            });
          }}
        >
          Search
        </button>
      </div>
      <div>
        {tags.map((tag) => {
          return <Tag key={tag.tagName} tagName={tag[0]} tagCount={tag[1]} />;
        })}
      </div>
    </StyledBox>
  );
};

export default App;
