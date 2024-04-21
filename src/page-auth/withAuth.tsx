import AuthLayout from "./layout/AuthLayout";

const withAuth = (WrappedComponent: any) => {
  // eslint-disable-next-line react/display-name
  return (props: any) => (
    <AuthLayout>
      <WrappedComponent {...props} />
    </AuthLayout>
  );
};

export default withAuth;
