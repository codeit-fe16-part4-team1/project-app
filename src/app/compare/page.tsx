'use client';
import { useState } from 'react';
import { getProductsAPI } from '@/api/products/getProductsAPI';
import { ProductItem } from '@/types/api';
import CompareBar from '@/components/CompareBar/CompareBar';
import CompareImage from '@/components/CompareImage/CompareImage';
import CompareDetail from '@/components/CompareDetail/CompareDetail';
import CompareCard from '@/components/CompareCard/CompareCard';
import CompareDetailDefault from '@/components/CompareDetail/CompareDetailDefault';
import Badge from '@/components/Badge/Badge';
import { Button } from '@/components/Button/Button';
import { useQuery } from '@tanstack/react-query';
import { useCompareStore } from '@/store/useCompareStore';
import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  // headers에서 현재 URL 가져오기
  const headersList = headers();
  const host = (await headersList).get('host') || process.env.DOMAIN;
  const currentUrl = `https://${host}/signup`;

  return {
    title: `상품비교 | mogazoa`,
    description: 'mogazoa에서 다양한 상품을 비교해보세요',
    openGraph: {
      title: '상품비교 | mogazoa',
      description: 'mogazoa에서 다양한 상품을 비교해보세요',
      url: currentUrl,
      type: 'website',
      siteName: 'mogazoa',
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

const fetchAllProducts = async () => {
  let allItems: ProductItem[] = [];
  let cursor: number | null = null;
  let hasMore = true;
  while (hasMore) {
    const { list, nextCursor } = await getProductsAPI({
      order: 'recent',
      cursor: cursor === null ? undefined : cursor,
    });
    allItems = [...allItems, ...list];
    if (nextCursor === null) {
      hasMore = false;
    }
    cursor = nextCursor;
  }
  return allItems;
};

const ComparePage = () => {
  const { products, addProductAtPosition, removeProduct, resetProducts } = useCompareStore();
  const [isComparing, setIsComparing] = useState(false);

  const {
    data: allProducts,
    isPending,
    error,
  } = useQuery({
    queryKey: ['allProducts'],
    queryFn: fetchAllProducts,
  });

  const selectedProductA = products[0] || null;
  const selectedProductB = products[1] || null;

  if (isPending || !allProducts) {
    return null;
  }
  if (error) {
    return <div>{error.message}</div>;
  }

  // A 위치에 상품을 추가하는 함수
  const handleSelectA = (product: ProductItem) => {
    // 이미 존재하는 상품인지 확인
    if (products.some((p) => p?.id === product.id)) return;
    addProductAtPosition(product, 'A');
  };

  // B 위치에 상품을 추가하는 함수
  const handleSelectB = (product: ProductItem) => {
    if (products.some((p) => p?.id === product.id)) return;
    addProductAtPosition(product, 'B');
  };

  const handleProductRemove = (position: 'A' | 'B') => {
    removeProduct(position);
    setIsComparing(false);
  };

  const handleCompareClick = () => {
    setIsComparing(true);
  };

  const handleResetClick = () => {
    resetProducts();
    setIsComparing(false);
  };

  const isRatingAWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductA.rating > selectedProductB.rating
      : undefined;
  const isReviewAWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductA.reviewCount > selectedProductB.reviewCount
      : undefined;
  const isFavoriteAWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductA.favoriteCount > selectedProductB.favoriteCount
      : undefined;

  const isRatingBWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductB.rating > selectedProductA.rating
      : undefined;
  const isReviewBWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductB.reviewCount > selectedProductA.reviewCount
      : undefined;
  const isFavoriteBWinner =
    isComparing && selectedProductA && selectedProductB
      ? selectedProductB.favoriteCount > selectedProductA.favoriteCount
      : undefined;

  const bothProductsSelected = selectedProductA !== null && selectedProductB !== null;

  let aWins = 0;
  let bWins = 0;
  let isTie = false;

  if (isComparing && selectedProductA && selectedProductB) {
    if (selectedProductA.rating > selectedProductB.rating) aWins++;
    if (selectedProductB.rating > selectedProductA.rating) bWins++;
    if (selectedProductA.reviewCount > selectedProductB.reviewCount) aWins++;
    if (selectedProductB.reviewCount > selectedProductA.reviewCount) bWins++;
    if (selectedProductA.favoriteCount > selectedProductB.favoriteCount) aWins++;
    if (selectedProductB.favoriteCount > selectedProductA.favoriteCount) bWins++;

    if (aWins === bWins) {
      isTie = true;
    }
  }

  const getHeaderText = () => {
    if (!isComparing) {
      return (
        <div className='font-cafe24-supermagic text-h2-bold md:text-[40px]'>
          둘 중 뭐가 더 나을까?
        </div>
      );
    }
    if (aWins > bWins) {
      return (
        <div className='font-cafe24-supermagic flex flex-col items-center gap-2 md:gap-3'>
          <div className='text-sub-headline-bold md:text-[40px]'>
            {`'${selectedProductA?.name}'`}
          </div>
          <div className='text-sub-headline-bold md:text-h3-bold text-gray-500'>
            상품을 선택하는 게 좋아요!
          </div>
        </div>
      );
    }
    if (bWins > aWins) {
      return (
        <div className='font-cafe24-supermagic flex flex-col items-center gap-2 md:gap-3'>
          <div className='text-sub-headline-bold md:text-[40px]'>
            {`'${selectedProductB?.name}'`}
          </div>
          <div className='text-sub-headline-bold md:text-h3-bold text-gray-500'>
            상품을 선택하는 게 좋아요!
          </div>
        </div>
      );
    }
    return (
      <div className='font-cafe24-supermagic text-h2-bold md:text-[40px]'>
        둘 다 좋은 선택이에요!
      </div>
    );
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-gray-100'>
      <div className='mt-10 flex w-85 flex-col items-center gap-10 md:mt-20 md:w-170 md:gap-16 lg:w-[889px]'>
        {getHeaderText()}

        {/* PC 레이아웃 (md 이상) */}
        <div className='hidden w-full flex-col justify-between md:flex md:flex-row'>
          {/* <div className='mt-90 flex hidden w-20 flex-col items-center gap-[63px] md:hidden lg:flex'>
            <div className='text-body2-bold whitespace-nowrap text-gray-600'>⭐️별점</div>
            <div className='text-body2-bold whitespace-nowrap text-gray-600'>📝 리뷰 개수</div>
            <div className='text-body2-bold whitespace-nowrap text-gray-600'>🫶🏻 찜 개수</div>
          </div> */}
          <CompareCard
            products={allProducts}
            selectedProduct={selectedProductA}
            label='A'
            onSelectProduct={handleSelectA}
            onRemoveProduct={() => handleProductRemove('A')}
            isComparing={isComparing}
            isRatingWinner={isRatingAWinner}
            isReviewCountWinner={isReviewAWinner}
            isFavoriteCountWinner={isFavoriteAWinner}
            isWinner={aWins > bWins}
            isTie={isTie}
          />
          <div className='mt-20 mb-12 flex flex-col items-center justify-between'>
            <div className='font-cafe24-supermagic text-h1-bold text-gray-600'>VS</div>

            <div className='flex w-20 flex-col items-center gap-[63px]'>
              <div className='text-body2-bold whitespace-nowrap text-gray-600'>⭐️별점</div>
              <div className='text-body2-bold whitespace-nowrap text-gray-600'>📝 리뷰 개수</div>
              <div className='text-body2-bold whitespace-nowrap text-gray-600'>🫶🏻 찜 개수</div>
            </div>
          </div>
          <CompareCard
            products={allProducts}
            selectedProduct={selectedProductB}
            label='B'
            onSelectProduct={handleSelectB}
            onRemoveProduct={() => handleProductRemove('B')}
            isComparing={isComparing}
            isRatingWinner={isRatingBWinner}
            isReviewCountWinner={isReviewBWinner}
            isFavoriteCountWinner={isFavoriteBWinner}
            isWinner={bWins > aWins}
            isTie={isTie}
          />
        </div>

        {/* 모바일 레이아웃 (md 미만) */}
        <div className='items-center md:hidden'>
          <div className='flex flex-col items-center justify-center gap-10'>
            {/* 이미지 영역 */}
            <div className='flex gap-[22px]'>
              <div className='relative flex w-25 flex-col gap-[11px]'>
                <CompareImage
                  productName={selectedProductA?.name || 'A'}
                  imageUrl={selectedProductA?.image || ''}
                  placeholder='A'
                />
                {isComparing && (aWins > bWins || isTie) && (
                  <Badge isWinner={aWins > bWins} isTie={isTie} />
                )}
                <div className='text-caption-bold text-center text-gray-800'>
                  {selectedProductA?.name || ''}
                </div>
              </div>
              <div className='font-cafe24-supermagic text-h3-bold flex items-center justify-center text-gray-900'>
                VS
              </div>
              <div className='relative flex w-25 flex-col gap-[11px]'>
                <CompareImage
                  productName={selectedProductB?.name || 'B'}
                  imageUrl={selectedProductB?.image || ''}
                  placeholder='B'
                />
                {isComparing && (bWins > aWins || isTie) && (
                  <Badge isWinner={bWins > aWins} isTie={isTie} />
                )}
                <div className='text-caption-bold text-center text-gray-800'>
                  {selectedProductB?.name || ''}
                </div>
              </div>
            </div>

            {/* 입력창 또는 상세정보 */}
            {isComparing ? (
              <div className='rounded-x5 flex h-60 w-[341px] items-center justify-center bg-white'>
                <div className='flex h-50 items-center justify-center gap-5'>
                  {selectedProductA ? (
                    <CompareDetail
                      rating={selectedProductA.rating}
                      reviewCount={selectedProductA.reviewCount}
                      favoriteCount={selectedProductA.favoriteCount}
                      isRatingWinner={isRatingAWinner}
                      isReviewCountWinner={isReviewAWinner}
                      isFavoriteCountWinner={isFavoriteAWinner}
                    />
                  ) : (
                    <CompareDetailDefault placeholder='A' />
                  )}
                  <div className='flex w-15 flex-col items-center gap-13 text-gray-600'>
                    <div className='text-[12px] whitespace-nowrap'>⭐️별점</div>
                    <div className='text-[12px] whitespace-nowrap'>📝 리뷰 개수</div>
                    <div className='text-[12px] whitespace-nowrap'>🫶🏻 찜 개수</div>
                  </div>
                  {selectedProductB ? (
                    <CompareDetail
                      rating={selectedProductB.rating}
                      reviewCount={selectedProductB.reviewCount}
                      favoriteCount={selectedProductB.favoriteCount}
                      isRatingWinner={isRatingBWinner}
                      isReviewCountWinner={isReviewBWinner}
                      isFavoriteCountWinner={isFavoriteBWinner}
                    />
                  ) : (
                    <CompareDetailDefault placeholder='B' />
                  )}
                </div>
              </div>
            ) : (
              <div className='flex w-85 flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                  <div className='text-body2-bold text-gray-900'>상품 A</div>
                  <CompareBar
                    products={allProducts}
                    selectedProduct={selectedProductA}
                    onSelectProduct={handleSelectA}
                    onRemoveProduct={() => handleProductRemove('A')}
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='text-body2-bold text-gray-900'>상품 B</div>
                  <CompareBar
                    products={allProducts}
                    selectedProduct={selectedProductB}
                    onSelectProduct={handleSelectB}
                    onRemoveProduct={() => handleProductRemove('B')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 비교하기/다시 비교하기 버튼 */}
        {isComparing ? (
          <Button onClick={handleResetClick} className='h-[50px] w-85 text-white md:h-[55px]'>
            다시 비교하기
          </Button>
        ) : (
          <Button
            onClick={handleCompareClick}
            disabled={!bothProductsSelected}
            className='h-[50px] w-85 md:h-[55px]'
          >
            {bothProductsSelected
              ? '상품 비교하기'
              : `비교할 상품 2개를 입력해주세요 (${[selectedProductA, selectedProductB].filter(Boolean).length}/2)`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
