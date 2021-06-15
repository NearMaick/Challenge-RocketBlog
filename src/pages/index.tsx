import { useState } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import Link from 'next/link';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page } = postsPagination;

  const [nextPage, setNextPage] = useState(next_page);
  const [results, setResults] = useState<Post[]>([]);

  async function handleNextPost(): Promise<void> {
    const data = await fetch(nextPage).then(response => response.json());
    setNextPage(data.next_page);
    setResults(data.results);
  }

  return (
    <>
      <Head>
        <title>Posts | TravelingSpace</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {postsPagination.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <strong>{post.data.subtitle}</strong>
                <div>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <strong>
                    <FiUser />
                    {post.data.author}
                  </strong>
                </div>
              </a>
            </Link>
          ))}
          {results &&
            results.map(result => (
              <Link key={result.uid} href={`/post/${result.uid}`}>
                <a>
                  <h2>{result.data.title}</h2>
                  <strong>{result.data.subtitle}</strong>
                  <div>
                    <time>
                      <FiCalendar />
                      {format(
                        new Date(result.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <strong>
                      <FiUser />
                      {result.data.author}
                    </strong>
                  </div>
                </a>
              </Link>
            ))}
          {nextPage && (
            <button onClick={() => handleNextPost()} type="button">
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));

  const { next_page } = postsResponse;

  const results = postsResponse.results.map(postResponse => {
    return {
      uid: postResponse.uid,
      first_publication_date: postResponse.first_publication_date,
      data: {
        title: postResponse.data.title,
        subtitle: postResponse.data.subtitle,
        author: postResponse.data.author,
      },
    };
  });

  const postsPagination = { next_page, results };

  return {
    props: { postsPagination },
  };
};
