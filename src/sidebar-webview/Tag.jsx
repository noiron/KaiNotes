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
  svg {
    margin-right: 4px;
  }
`;

const Tag = (props) => {
  const { tagName, tagCount } = props;

  return (
    <StyledTag>
      <Icon />
      {`${tagName} x ${tagCount}`}
    </StyledTag>
  );
};

export default Tag;
