import { Profile } from "./line-profile";

type Props = {
  params: {
    id: string;
  };
};

export default function CalenderPage({ params }: Props) {
  return <Profile id={params.id} />;
}
