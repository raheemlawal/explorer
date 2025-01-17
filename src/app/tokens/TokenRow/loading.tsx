import React, { FC } from 'react';

import { Box } from '../../../ui/Box';
import { Flex } from '../../../ui/Flex';
import { Skeleton } from '../../../ui/Skeleton';
import { Td } from '../../../ui/Td';
import { Tr } from '../../../ui/Tr';

export const Loading: FC = () => {
  return (
    <Tr>
      <Td padding={'10px 20px 10px 16px'} width={['auto', 'auto', '30%']}>
        <Flex alignItems={'center'} gap={'8px'}>
          <Skeleton width={'36px'} height={'36px'} />
          <Box width={'100%'} maxWidth={'120px'}>
            <Skeleton height={'15px'} />
          </Box>
        </Flex>
      </Td>
      <Td padding={'10px'} display={['none', 'none', 'table-cell']}>
        <Box maxWidth={'500px'}>
          <Skeleton height={'15px'} />
        </Box>
      </Td>
      <Td isNumeric width={'130px'} padding={'10px 16px 10px 20px'}>
        <Box maxWidth={'70px'} marginLeft={'auto'}>
          <Skeleton height={'15px'} />
        </Box>
      </Td>
    </Tr>
  );
};
