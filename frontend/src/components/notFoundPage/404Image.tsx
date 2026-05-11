import errorImage from "../../assets/404.png";

export default function ErrorImage() {
  return (
    <div className="flex justify-center lg:justify-end">
      <img
        src={errorImage}
        alt="Erreur 404"
        className="w-full max-w-[260px] object-contain sm:max-w-[320px] lg:max-w-[360px]"
      />
    </div>
  );
}
