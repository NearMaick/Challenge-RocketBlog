import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.headerContainer}>
      <div>
        <Link href="/">
          <a>
            <Image src="/assets/Logo.png" alt="logo" width={238} height={25} />
          </a>
        </Link>
      </div>
    </div>
  );
}
