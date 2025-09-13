import ProfileSection from '../../components/ProfileSection';
import ProductSection from '../../components/ProductSection';
import { getUserInfo } from '@/lib/getUserInfo';
import { notFound, redirect } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getUserProfileAPI } from '@/api/user/getUserProfileAPI';
import { productKeys, profileKeys } from '@/constant/queryKeys';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getUserProductsAPI } from '@/api/user/getUserProductsAPI';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { userId } = await params;
  const profileId = Number(userId);
  if (Number.isNaN(profileId)) {
    notFound();
  }

  // headers에서 현재 URL 가져오기
  const headersList = headers();
  const host = (await headersList).get('host') || process.env.DOMAIN;
  const currentUrl = `https://${host}/user/${userId}`;

  try {
    const userProfile = await getUserProfileAPI({ userId: profileId });

    const { nickname, description, followersCount, reviewCount } = userProfile;

    const metaTitle = `${nickname}님의 프로필 | mogazoa`;
    const metaDescription = `${nickname}님의 프로필 | 팔로워 ${followersCount}명 • 리뷰 ${reviewCount}개\n\n${description}\n\nmogazoa에서 다양한 상품 리뷰와 정보를 확인하세요`;

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: [nickname, '프로필', '리뷰', '상품평가', 'mogazoa'],
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        siteName: 'mogazoa',
        locale: 'ko_KR',
        type: 'profile',
        url: currentUrl,
        images: userProfile.image
          ? [
              {
                url: userProfile.image,
                width: 200,
                height: 200,
                alt: `${nickname}님의 프로필 사진`,
              },
            ]
          : [],
      },
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: currentUrl,
      },
    };
  } catch (error) {
    console.error('Failed to fetch user profile for metadata:', error);

    return {
      title: `사용자 프로필 | mogazoa`,
      description: '사용자의 프로필과 리뷰를 확인해보세요.',
      openGraph: {
        title: '사용자 프로필 | mogazoa',
        description: '사용자의 프로필과 리뷰를 확인해보세요.',
        url: currentUrl,
        type: 'profile',
      },
    };
  }
};

const UserPage = async ({ params }: PageProps) => {
  const queryClient = new QueryClient();

  const { userId } = await params;
  const profileId = Number(userId);

  if (Number.isNaN(profileId)) {
    notFound();
  }

  const { userId: myProfileId } = await getUserInfo();

  if (profileId === myProfileId) redirect('/mypage');

  console.log(`[DEBUG] User Profile Id: ${profileId}`);

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: profileKeys.detail(profileId),
      queryFn: () => getUserProfileAPI({ userId: profileId }),
    }),
    queryClient.fetchInfiniteQuery({
      queryKey: productKeys.userProductList(profileId, 'reviewed'),
      queryFn: ({ pageParam }) =>
        getUserProductsAPI({
          userId: profileId,
          type: 'reviewed',
          ...(pageParam && { cursor: pageParam }),
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      pages: 0,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileSection profileId={profileId} isMyProfile={false} />
      <ProductSection profileId={profileId} />
    </HydrationBoundary>
  );
};

export default UserPage;
