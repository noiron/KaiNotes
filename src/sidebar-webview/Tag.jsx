/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import styled from 'styled-components';
import Icon from '../../media/tag.svg';

const StyledTag = styled.span`
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 2px 4px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 12px;
  svg {
    margin-right: 4px;
  }
  .quantity {
    color: #aaa;
  }
`;

const Tag = (props) => {
  const { tagName, tagCount, onClick } = props;

  return (
    <StyledTag onClick={onClick}>
      <Icon />
      <span>{tagName}</span>
      <span className='quantity'>&nbsp;x&nbsp;{tagCount}</span>
    </StyledTag>
  );
};

export default Tag;
